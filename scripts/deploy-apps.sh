#!/usr/bin/env bash
set -euo pipefail

# Idempotent deploy/update script for DEV and PROD apps
# - Stashes local changes if any
# - Fetches & pulls from git
# - Installs deps (npm ci or npm install)
# - Builds (npm run build)
# - Restarts PM2 by name (if provided) or attempts to map by port
#
# Environment overrides (export before run or pass VAR=...):
#   DEV_APP_DIR=/var/www/dintrafikskolax_dev
#   PROD_APP_DIR=/var/www/dintrafikskolax_prod
#   DEV_GIT_BRANCH=main
#   PROD_GIT_BRANCH=main
#   PM2_DEV_NAME=trafikskola-dev
#   PM2_PROD_NAME=trafikskola-prod
#   DEV_PORT=3000
#   PROD_PORT=3001

DEV_APP_DIR="${DEV_APP_DIR:-/var/www/dintrafikskolax_dev}"
PROD_APP_DIR="${PROD_APP_DIR:-/var/www/dintrafikskolax_prod}"
DEV_GIT_BRANCH="${DEV_GIT_BRANCH:-main}"
PROD_GIT_BRANCH="${PROD_GIT_BRANCH:-main}"
PM2_DEV_NAME="${PM2_DEV_NAME:-}"
PM2_PROD_NAME="${PM2_PROD_NAME:-}"
DEV_PORT="${DEV_PORT:-3000}"
PROD_PORT="${PROD_PORT:-3001}"

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "[-] Missing command: $1" >&2; exit 1; }; }

need_cmd git
need_cmd bash
if command -v corepack >/dev/null 2>&1; then corepack enable || true; fi
if ! command -v npm >/dev/null 2>&1; then echo "[!] npm not found; install Node.js/npm first" >&2; fi

port_pid() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v P=":$port" '$4 ~ P {print $7}' | sed -E 's/.*,pid=([0-9]+).*/\1/' | head -n1
  elif command -v lsof >/dev/null 2>&1; then
    lsof -i :"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1
  fi
}

restart_pm2_by_name_or_port() {
  local name="$1" port="$2"
  if command -v pm2 >/dev/null 2>&1; then
    if [[ -n "$name" ]]; then
      echo "[+] Restarting PM2 process: $name"
      pm2 restart "$name" || echo "[!] Failed to restart $name"
      pm2 save || true
      return 0
    fi
    echo "[i] No PM2 name provided; trying to find process by port $port"
    local pid
    pid="$(port_pid "$port" || true)"
    if [[ -n "${pid:-}" ]] && pm2 jlist >/dev/null 2>&1; then
      local pmid
      pmid="$(pm2 jlist | sed 's/\\n/\n/g' | awk -v pid="$pid" 'BEGIN{ RS="{"; FS="\n" } $0 ~ /"pid"\s*:\s*"?"?pid/ { for (i=1;i<=NF;i++){ if($i ~ /"pm_id"/){ gsub(/[^0-9]/, "", $i); print $i; break } } }' | head -n1)"
      if [[ -n "${pmid:-}" ]]; then
        echo "[+] Restarting PM2 id: $pmid (port $port)"
        pm2 restart "$pmid" || echo "[!] Failed to restart PM2 id $pmid"
        pm2 save || true
        return 0
      fi
    fi
    echo "[!] Could not map port $port to a PM2 process; please set PM2_*_NAME"
  else
    echo "[!] PM2 not installed; skipping restart"
  fi
}

update_build_one() {
  local app_dir="$1" branch="$2" env_label="$3" port="$4" pm2_name="$5"
  echo "\n==== [$env_label] $app_dir (branch=$branch) ===="
  if [[ ! -d "$app_dir" ]]; then
    echo "[!] Skipping $env_label: directory not found: $app_dir"
    return 0
  fi
  pushd "$app_dir" >/dev/null || { echo "[-] Cannot cd to $app_dir" >&2; return 1; }

  if [[ -d .git ]]; then
    echo "[i] Git head before:"; git log -1 --oneline || true
    # Stash local changes, if any
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
      echo "[i] Local changes detected → stashing"
      git stash push --include-untracked -m "auto-stash $(date +%F_%T)" || true
    fi
    echo "[i] Fetch & pull..."
    git fetch --all --tags || true
    git checkout "$branch" || true
    git pull --rebase || true
    echo "[i] Git head after:"; git log -1 --oneline || true
  else
    echo "[!] No git repository in $app_dir; skipping git operations"
  fi

  if [[ -f package-lock.json ]]; then
    echo "[i] Installing dependencies (npm ci)..."
    npm ci || npm install
  elif [[ -f package.json ]]; then
    echo "[i] Installing dependencies (npm install)..."
    npm install || true
  fi

  if [[ -f package.json ]]; then
    echo "[i] Building application..."
    npm run build
  fi

  popd >/dev/null || true

  restart_pm2_by_name_or_port "$pm2_name" "$port"
}

echo "[i] Starting deploy..."
update_build_one "$DEV_APP_DIR"  "$DEV_GIT_BRANCH"  "DEV"  "$DEV_PORT"  "$PM2_DEV_NAME"
update_build_one "$PROD_APP_DIR" "$PROD_GIT_BRANCH" "PROD" "$PROD_PORT" "$PM2_PROD_NAME"

echo "[i] PM2 status:"; (pm2 list || true)
echo "[i] Done."


