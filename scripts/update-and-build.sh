#!/usr/bin/env bash
set -Eeuo pipefail

# Safe updater for Git + Node app with optional Redis cache cleanup and build.
#
# Usage:
#   ./scripts/update-and-build.sh
#
# Optional env vars:
#   THRESHOLD_LOG_MB   (default 200)  Clean logs/ if larger than this many MB
#   FORCE_BUILD        (0|1, default 0)  Force npm run build even if outputs are fresh
#   CLEAR_REDIS        (0|keys|all, default 0)  Clear Redis cache: 'keys' by prefix or 'all' to flush
#   REDIS_URL          (e.g. redis://:pass@host:6379/0)
#   REDIS_HOST         (default 127.0.0.1)
#   REDIS_PORT         (default 6379)
#   REDIS_DB           (default 0)
#   REDIS_PREFIX       (optional key prefix to delete when CLEAR_REDIS=keys)

THRESHOLD_LOG_MB="${THRESHOLD_LOG_MB:-200}"
FORCE_BUILD="${FORCE_BUILD:-0}"
CLEAR_REDIS="${CLEAR_REDIS:-0}"
REDIS_URL="${REDIS_URL:-}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_DB="${REDIS_DB:-0}"
REDIS_PREFIX="${REDIS_PREFIX:-}"

log()  { printf "\033[1;36m[info]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m[err ]\033[0m %s\n" "$*" >&2; }

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

cd "$(repo_root)"

log "Repo: $(pwd)"

# --- 1) Git safety and pull ---
log "Checking git status…"
branch="$(git rev-parse --abbrev-ref HEAD)"
remote_upstream="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"

stashed=0
if [[ -n "$(git status --porcelain)" ]]; then
  warn "Uncommitted changes detected; stashing before pull…"
  git stash push -u -m "auto-stash $(date +%Y-%m-%dT%H:%M:%S%z)" || true
  stashed=1
fi

log "Fetching remote updates…"
git fetch --all --prune || true

if [[ -z "$remote_upstream" ]]; then
  if git rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
    git branch --set-upstream-to "origin/$branch" "$branch" || true
    remote_upstream="origin/$branch"
  fi
fi

behind=0
if [[ -n "$remote_upstream" ]]; then
  diverge="$(git rev-list --left-right --count "${branch}...${remote_upstream}" 2>/dev/null || echo "0	0")"
  behind="$(echo "$diverge" | awk '{print $2}')"
fi

if [[ "$behind" -gt 0 ]]; then
  log "Pulling latest changes (--rebase)…"
  git pull --rebase || { err "git pull failed"; exit 1; }
else
  log "No remote updates for $branch."
fi

if [[ "$stashed" -eq 1 ]]; then
  set +e
  git stash pop
  rc=$?
  set -e
  if [[ $rc -ne 0 ]]; then
    warn "Stash pop had conflicts; stash kept. Resolve manually (git stash list)."
  else
    log "Stash applied."
  fi
fi

# --- 2) Clean logs if large ---
for LOGDIR in "logs" "log"; do
  if [[ -d "$LOGDIR" ]]; then
    size_mb="$(du -sm "$LOGDIR" 2>/dev/null | awk '{print $1}')"; size_mb="${size_mb:-0}"
    if [[ "$size_mb" -ge "$THRESHOLD_LOG_MB" ]]; then
      warn "Cleaning $LOGDIR (size=${size_mb}MB >= ${THRESHOLD_LOG_MB}MB)…"
      find "$LOGDIR" -type f -delete || true
    fi
  fi
done

# --- 3) Detect dependency changes ---
pkg_changed=0
if git rev-parse -q --verify HEAD@{1} >/dev/null 2>&1; then
  changed_files="$(git diff --name-only HEAD@{1} HEAD || true)"
  if echo "$changed_files" | grep -Eq '(^|/)package(-lock)?\.json$|(^|/)pnpm-lock\.yaml$|(^|/)yarn\.lock$'; then
    pkg_changed=1
  fi
fi

# --- 4) Clear old build artifacts and caches ---
clear_build_artifacts() {
  log "Clearing old build artifacts and caches…"
  rm -rf .next .turbo .cache .vite .parcel-cache .output .nuxt dist build node_modules/.cache 2>/dev/null || true
}
clear_build_artifacts

# --- 5) Install dependencies if needed ---
if [[ ! -d node_modules ]] || [[ "$pkg_changed" -eq 1 ]]; then
  if [[ -f package-lock.json ]]; then
    log "Installing dependencies via npm ci…"
    npm ci
  else
    log "Installing dependencies via npm install…"
    npm install --prefer-offline --no-audit
  fi
else
  log "Dependencies up to date; skipping install."
fi

# --- 6) Determine if build is needed ---
needs_build=0
if [[ "$FORCE_BUILD" -eq 1 ]]; then
  needs_build=1
else
  if [[ -f package.json ]]; then
    last_commit_ts="$(git log -1 --format=%ct 2>/dev/null || echo 0)"
    build_dir=".next"; [[ -d dist ]] && build_dir="dist"; [[ -d build ]] && build_dir="build"
    if [[ ! -d "$build_dir" ]]; then needs_build=1
    else
      build_ts="$(stat -c %Y "$build_dir" 2>/dev/null || echo 0)"
      if [[ "$last_commit_ts" -gt "$build_ts" ]]; then needs_build=1; fi
    fi
  else
    needs_build=1
  fi
fi

# --- 7) Build and verify ---
if [[ "$needs_build" -eq 1 ]]; then
  log "Running npm run build…"
  if ! npm run build --if-present; then
    err "Build failed."; exit 1
  fi
  # Verify
  if [[ -f next.config.js || -f next.config.mjs || -d app || -d pages ]]; then
    [[ -d .next ]] || { err "Next.js build missing .next/"; exit 1; }
  else
    if [[ ! -d dist && ! -d build ]]; then
      warn "No dist/build produced; ensure your build script outputs artifacts."
    fi
  fi
  log "Build complete."
else
  log "Build is up-to-date; skipping."
fi

# --- 8) Optional: clear Redis cache ---
clear_redis_cache() {
  local mode="$1"
  command -v redis-cli >/dev/null 2>&1 || { warn "redis-cli not found; skipping Redis cleanup."; return 0; }

  local args=()
  if [[ -n "$REDIS_URL" ]]; then
    args=(-u "$REDIS_URL")
  else
    args=(-h "$REDIS_HOST" -p "$REDIS_PORT" -n "$REDIS_DB")
  fi

  if [[ "$mode" == "all" ]]; then
    warn "Redis FLUSHDB (db=$REDIS_DB)…"
    redis-cli "${args[@]}" FLUSHDB || warn "FLUSHDB failed"
    return 0
  fi

  # mode=keys — delete by prefix (safer)
  local prefixes=()
  if [[ -n "$REDIS_PREFIX" ]]; then
    prefixes+=("$REDIS_PREFIX")
  else
    # Known transient prefixes used in this app
    prefixes+=("qliro:push:" "cache:" "next:" "vercel:" "swr:")
  fi

  for p in "${prefixes[@]}"; do
    log "Deleting Redis keys with prefix '$p'…"
    local cursor=0
    while :; do
      # shellcheck disable=SC2207
      local out=($(redis-cli "${args[@]}" --raw SCAN "$cursor" MATCH "${p}*" COUNT 1000)) || break
      cursor="${out[0]:-0}"
      if [[ ${#out[@]} -gt 1 ]]; then
        for ((i=1;i<${#out[@]};i++)); do
          local k="${out[$i]}"
          [[ -n "$k" ]] && redis-cli "${args[@]}" DEL "$k" >/dev/null || true
        done
      fi
      [[ "$cursor" == "0" ]] && break
    done
  done
}

if [[ "$CLEAR_REDIS" != "0" ]]; then
  clear_redis_cache "$CLEAR_REDIS"
fi

# --- 9) Residual cache cleanup ---
find node_modules -type d -name '.cache' -prune -exec rm -rf {} + 2>/dev/null || true

log "Done."


