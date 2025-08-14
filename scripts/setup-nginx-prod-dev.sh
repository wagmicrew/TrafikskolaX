#!/usr/bin/env bash
set -euo pipefail

# Ensure this script is executed with bash (not sh)
if [ -z "${BASH_VERSION:-}" ]; then
  echo "[-] This script must be run with bash. Use: sudo bash $0 ..." >&2
  exit 1
fi

# Rebuild Nginx for prod+dev, wire to PM2 Node apps, ensure HTTPS via Certbot, and manage PM2.
# - Configures two apps:
#   - Production: /var/www/dintrafikskolax_prod on port 3000
#   - Development: /var/www/dintrafikskolax_dev on port 3001
# - Generates a single nginx site config with both domains, HTTPS only (no http/2)
# - Optionally obtains certificates with certbot if missing
# - Verifies prerequisites (nginx, certbot, pm2, node, npm, git, redis)
# - Updates code to latest main, cleans caches, rebuilds prod, and restarts PM2 (with confirmation)

########################################
# Defaults (override via env or args)
########################################
PROD_DIR=${PROD_DIR:-/var/www/dintrafikskolax_prod}
DEV_DIR=${DEV_DIR:-/var/www/dintrafikskolax_dev}
PROD_DOMAIN=${PROD_DOMAIN:-dintrafikskolahlm.se}
PROD_WWW=${PROD_WWW:-www.dintrafikskolahlm.se}
DEV_DOMAIN=${DEV_DOMAIN:-dev.dintrafikskolahlm.se}
PROD_PORT=${PROD_PORT:-3000}
DEV_PORT=${DEV_PORT:-3001}
SITE_NAME=${SITE_NAME:-dintrafikskolax_multi}
NGINX_SITES_AVAILABLE=${NGINX_SITES_AVAILABLE:-/etc/nginx/sites-available}
NGINX_SITES_ENABLED=${NGINX_SITES_ENABLED:-/etc/nginx/sites-enabled}
YES=${YES:-false}
PM2_USER=${PM2_USER:-$(whoami)}
PM2_HOME=${PM2_HOME:-$(getent passwd "$PM2_USER" | cut -d: -f6)}
CERTBOT_EMAIL=${CERTBOT_EMAIL:-admin@${PROD_DOMAIN#www.}}

########################################
# Helpers
########################################
usage() {
  cat <<USAGE
Usage: $0 [--yes] [--prod-dir PATH] [--dev-dir PATH] \
          [--prod-domain DOMAIN] [--prod-www DOMAIN] [--dev-domain DOMAIN] \
          [--prod-port N] [--dev-port N] [--site-name NAME] [--pm2-user USER] [--certbot-email EMAIL]

Example:
  sudo bash $0 --yes \
    --prod-dir /var/www/dintrafikskolax_prod \
    --dev-dir /var/www/dintrafikskolax_dev \
    --prod-domain dintrafikskolahlm.se \
    --prod-www www.dintrafikskolahlm.se \
    --dev-domain dev.dintrafikskolahlm.se \
    --prod-port 3000 --dev-port 3001 \
    --site-name dintrafikskolax_multi \
    --pm2-user ubuntu \
    --certbot-email admin@dintrafikskolahlm.se
USAGE
}

confirm() {
  local prompt="$1"
  if [ "$YES" = "true" ]; then
    echo "[i] $prompt (auto-yes)"
    return 0
  fi
  read -r -p "$prompt [y/N]: " reply || true
  case "$reply" in
    y|Y|yes|YES) return 0;;
    *) return 1;;
  esac
}

need() { command -v "$1" >/dev/null 2>&1 || { echo "[-] Missing command: $1" >&2; exit 1; }; }

pick_cert_dir() {
  local d="$1"
  if [ -d "/etc/letsencrypt/live/$d" ]; then
    echo "/etc/letsencrypt/live/$d"; return 0
  fi
  # try apex if www.*
  if [[ "$d" == www.* ]]; then
    local apex="${d#www.}"
    if [ -d "/etc/letsencrypt/live/$apex" ]; then
      echo "/etc/letsencrypt/live/$apex"; return 0
    fi
  fi
  # last resort: any folder containing domain substring
  for cand in /etc/letsencrypt/live/*; do
    [ -d "$cand" ] || continue
    case "$cand" in *"$d"*) echo "$cand"; return 0;; esac
  done
  echo ""; return 1
}

ensure_cert() {
  local primary="$1"; shift
  local extra_domains=("$@")
  local dir
  dir="$(pick_cert_dir "$primary" || true)"
  if [ -n "$dir" ]; then
    echo "$dir"; return 0
  fi
  echo "[i] No cert for $primary – requesting via certbot --nginx"
  # Attempt to get a multi-domain cert including extras that are not empty
  local args=(-d "$primary")
  for d in "${extra_domains[@]}"; do
    [ -n "$d" ] && args+=( -d "$d" )
  done
  # This uses the nginx plugin; it will install a temporary HTTP server block for challenge
  certbot --nginx --non-interactive --agree-tos -m "$CERTBOT_EMAIL" "${args[@]}" || true
  dir="$(pick_cert_dir "$primary" || true)"
  if [ -z "$dir" ]; then
    echo "[-] Failed to obtain certificate for $primary" >&2
    return 1
  fi
  echo "$dir"
}

########################################
# Parse args
########################################
while [ $# -gt 0 ]; do
  case "$1" in
    --yes|-y) YES=true; shift;;
    --prod-dir) PROD_DIR="$2"; shift 2;;
    --dev-dir) DEV_DIR="$2"; shift 2;;
    --prod-domain) PROD_DOMAIN="$2"; shift 2;;
    --prod-www) PROD_WWW="$2"; shift 2;;
    --dev-domain) DEV_DOMAIN="$2"; shift 2;;
    --prod-port) PROD_PORT="$2"; shift 2;;
    --dev-port) DEV_PORT="$2"; shift 2;;
    --site-name) SITE_NAME="$2"; shift 2;;
    --pm2-user) PM2_USER="$2"; PM2_HOME=$(getent passwd "$PM2_USER" | cut -d: -f6); shift 2;;
    --certbot-email) CERTBOT_EMAIL="$2"; shift 2;;
    --help|-h) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1;;
  esac
done

########################################
# Prereq checks
########################################
need nginx
need certbot
need pm2
need node
need npm
need git

if ! command -v redis-server >/dev/null 2>&1; then
  echo "[!] redis-server not found. Install with: sudo apt-get update && sudo apt-get install -y redis-server"
else
  echo "[i] redis-server found: $(redis-server --version | awk '{print $3}')"
fi

echo "[i] Using PM2 as user: $PM2_USER (home: $PM2_HOME)"

########################################
# Obtain/verify certificates
########################################
PROD_CERT_DIR="$(ensure_cert "$PROD_DOMAIN" "$PROD_WWW" || true)"
if [ -z "$PROD_CERT_DIR" ]; then
  echo "[-] Cannot continue without a certificate for $PROD_DOMAIN" >&2
  exit 1
fi

DEV_CERT_DIR="$(ensure_cert "$DEV_DOMAIN" || true)"
if [ -z "$DEV_CERT_DIR" ]; then
  echo "[!] No certificate for $DEV_DOMAIN. If this domain should be active, run certbot for it later. Skipping dev SSL."
fi

########################################
# Generate Nginx configs (separate files for prod and dev, HTTPS only, no http2)
########################################
PROD_SITE_NAME=${PROD_SITE_NAME:-dintrafikskolax_prod}
DEV_SITE_NAME=${DEV_SITE_NAME:-dintrafikskolax_dev}

# Remove old combined site if present to avoid conflicts
OLD_COMBINED="$NGINX_SITES_ENABLED/$SITE_NAME.conf"
[ -f "$OLD_COMBINED" ] && rm -f "$OLD_COMBINED" || true
[ -f "$NGINX_SITES_AVAILABLE/$SITE_NAME.conf" ] && rm -f "$NGINX_SITES_AVAILABLE/$SITE_NAME.conf" || true

# --- PROD ---
PROD_CONF_NAME="$PROD_SITE_NAME.conf"
PROD_CONF_PATH="$NGINX_SITES_AVAILABLE/$PROD_CONF_NAME"
[ -f "$PROD_CONF_PATH" ] && cp -a "$PROD_CONF_PATH" "$PROD_CONF_PATH.$(date +%F_%H%M%S).bak" && echo "[i] Backed up: $PROD_CONF_PATH.*.bak"

cat >"$PROD_CONF_PATH" <<EOF
# Managed by setup-nginx-prod-dev.sh (prod)

server {
    listen 80;
    server_name $PROD_DOMAIN $PROD_WWW;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl; # http2 disabled intentionally
    server_name $PROD_DOMAIN $PROD_WWW;

    ssl_certificate     $PROD_CERT_DIR/fullchain.pem;
    ssl_certificate_key $PROD_CERT_DIR/privkey.pem;
    ssl_stapling off;

    access_log /var/log/nginx/${PROD_SITE_NAME}.access.log;
    error_log  /var/log/nginx/${PROD_SITE_NAME}.error.log warn;

    # Basic security and embedding policy
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob:; frame-ancestors 'self' https://*.qliro.com https://qliro.com; frame-src https://*.qliro.com; child-src https://*.qliro.com; connect-src 'self' https:; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https: 'unsafe-inline';" always;

    # CORS (optional)
    set \$cors_allow_origin "\$scheme://\$host";
    add_header 'Access-Control-Allow-Origin' \$cors_allow_origin always;
    add_header 'Vary' 'Origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET,POST,PUT,PATCH,DELETE,OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type,Accept,X-Requested-With,X-Request-ID' always;

    location / {
        proxy_pass http://127.0.0.1:$PROD_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Request-ID \$request_id;
        proxy_buffering off;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
        send_timeout 120s;
    }
}
EOF

ln -sf "$PROD_CONF_PATH" "$NGINX_SITES_ENABLED/$PROD_CONF_NAME"

# Disable any other enabled sites conflicting with prod domains
for f in "$NGINX_SITES_ENABLED"/*; do
  [ -e "$f" ] || continue
  if [[ "$f" == *"$PROD_CONF_NAME" ]]; then continue; fi
  if grep -Eqs "server_name\s+.*($PROD_DOMAIN|$PROD_WWW)" "$f"; then
    echo "[i] Disabling conflicting prod site: $(basename "$f")"
    rm -f "$f"
  fi
done

# --- DEV ---
if [ -n "$DEV_CERT_DIR" ]; then
  DEV_CONF_NAME="$DEV_SITE_NAME.conf"
  DEV_CONF_PATH="$NGINX_SITES_AVAILABLE/$DEV_CONF_NAME"
  [ -f "$DEV_CONF_PATH" ] && cp -a "$DEV_CONF_PATH" "$DEV_CONF_PATH.$(date +%F_%H%M%S).bak" && echo "[i] Backed up: $DEV_CONF_PATH.*.bak"

  cat >"$DEV_CONF_PATH" <<EOF
# Managed by setup-nginx-prod-dev.sh (dev)

server {
    listen 80;
    server_name $DEV_DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl; # http2 disabled intentionally
    server_name $DEV_DOMAIN;

    ssl_certificate     $DEV_CERT_DIR/fullchain.pem;
    ssl_certificate_key $DEV_CERT_DIR/privkey.pem;
    ssl_stapling off;

    access_log /var/log/nginx/${DEV_SITE_NAME}.access.log;
    error_log  /var/log/nginx/${DEV_SITE_NAME}.error.log warn;

    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob:; frame-ancestors 'self' https://*.qliro.com https://qliro.com; frame-src https://*.qliro.com; child-src https://*.qliro.com; connect-src 'self' https:; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https: 'unsafe-inline';" always;

    set \$cors_allow_origin "\$scheme://\$host";
    add_header 'Access-Control-Allow-Origin' \$cors_allow_origin always;
    add_header 'Vary' 'Origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET,POST,PUT,PATCH,DELETE,OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type,Accept,X-Requested-With,X-Request-ID' always;

    location / {
        proxy_pass http://127.0.0.1:$DEV_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Request-ID \$request_id;
        proxy_buffering off;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
        send_timeout 120s;
    }
}
EOF

  ln -sf "$DEV_CONF_PATH" "$NGINX_SITES_ENABLED/$DEV_CONF_NAME"

  # Disable any other enabled sites conflicting with dev domain
  for f in "$NGINX_SITES_ENABLED"/*; do
    [ -e "$f" ] || continue
    if [[ "$f" == *"$DEV_CONF_NAME" ]]; then continue; fi
    if grep -Eqs "server_name\s+.*($DEV_DOMAIN)" "$f"; then
      echo "[i] Disabling conflicting dev site: $(basename "$f")"
      rm -f "$f"
    fi
  done
else
  echo "[!] Skipping dev nginx site (no certificate for $DEV_DOMAIN)."
fi

# Validate and reload nginx
if nginx -t; then
  systemctl reload nginx || systemctl start nginx
else
  echo "[-] nginx test failed. See errors above." >&2
  exit 1
fi

########################################
# PM2: update code, clean caches, build prod, run both apps
########################################

pm2 describe trafikskolax-prod >/dev/null 2>&1 || true
pm2 describe trafikskolax-dev  >/dev/null 2>&1 || true

update_repo() {
  local path="$1"
  echo "[i] Updating repo at $path"
  if [ ! -d "$path/.git" ]; then
    echo "[-] Not a git repo: $path" >&2; return 1
  fi
  pushd "$path" >/dev/null
  git fetch --all --prune

  # Determine default remote branch (origin/HEAD), fallback to main or master
  get_default_remote_branch() {
    local def
    def=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || true)
    if [ -n "$def" ]; then
      echo "${def##*/}"; return 0
    fi
    if git show-ref --verify --quiet refs/remotes/origin/main; then echo main; return 0; fi
    if git show-ref --verify --quiet refs/remotes/origin/master; then echo master; return 0; fi
    git for-each-ref --format='%(refname:short)' refs/remotes/origin | head -n1 | awk -F/ '{print $2}'
  }

  local current_branch
  current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  local default_branch
  default_branch=$(get_default_remote_branch)
  if [ -z "$default_branch" ]; then
    default_branch="$current_branch"
  fi
  if [ -z "$default_branch" ]; then
    echo "[-] Could not determine default branch for $path; skipping update" >&2
    popd >/dev/null; return 1
  fi

  if [ "$current_branch" != "$default_branch" ]; then
    echo "[i] Switching to default branch: $default_branch"
    # Ensure local branch exists tracking origin
    if ! git show-ref --verify --quiet "refs/heads/$default_branch"; then
      git checkout -b "$default_branch" "origin/$default_branch" 2>/dev/null || \
      git checkout -t "origin/$default_branch" 2>/dev/null || true
    fi
    git checkout "$default_branch" || true
  fi

  git stash push -u -m "auto-stash $(date +%F_%T)" || true
  git pull --ff-only origin "$default_branch" || {
    git fetch origin "$default_branch":"$default_branch" || true
    git reset --hard "origin/$default_branch" || true
  }
  popd >/dev/null
}

clean_caches() {
  local path="$1"
  echo "[i] Cleaning caches in $path (.next, .turbo, .cache, node_modules/.cache)"
  rm -rf "$path/.next" "$path/.turbo" "$path/.cache" "$path/node_modules/.cache" || true
}

install_deps() {
  local path="$1"
  pushd "$path" >/dev/null
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
  popd >/dev/null
}

build_prod() {
  local path="$1"
  pushd "$path" >/dev/null
  npm run build
  popd >/dev/null
}

start_pm2_prod() {
  local path="$1"
  echo "[i] Starting PM2 prod in cluster on port $PROD_PORT"
  pm2 delete trafikskolax-prod >/dev/null 2>&1 || true
  pushd "$path" >/dev/null
  [ -d node_modules ] || npm ci --no-audit --no-fund
  [ -d .next ] || npm run build
  NODE_ENV=production pm2 start node_modules/next/dist/bin/next \
    --name trafikskolax-prod \
    -i max \
    -- start -p "$PROD_PORT" --hostname 127.0.0.1
  popd >/dev/null
}

start_pm2_dev() {
  local path="$1"
  echo "[i] Starting PM2 dev in fork on port $DEV_PORT"
  pm2 delete trafikskolax-dev >/dev/null 2>&1 || true
  pushd "$path" >/dev/null
  [ -d node_modules ] || npm ci --no-audit --no-fund
  NODE_ENV=development pm2 start node_modules/next/dist/bin/next \
    --name trafikskolax-dev \
    -- dev -p "$DEV_PORT" --hostname 127.0.0.1
  popd >/dev/null
}

if confirm "Update repositories (git pull main) for prod and dev?"; then
  update_repo "$PROD_DIR"
  update_repo "$DEV_DIR"
fi

if confirm "Clean caches (.next/.turbo/.cache) for prod and dev?"; then
  clean_caches "$PROD_DIR"
  clean_caches "$DEV_DIR"
fi

if confirm "Install npm dependencies (npm ci/install) for prod and dev?"; then
  install_deps "$PROD_DIR"
  install_deps "$DEV_DIR"
fi

if confirm "Build production app (npm run build) for prod?"; then
  build_prod "$PROD_DIR"
fi

if confirm "(Re)start PM2 processes for prod and dev?"; then
  start_pm2_prod "$PROD_DIR"
  start_pm2_dev  "$DEV_DIR"
  pm2 save
fi

if confirm "Configure PM2 startup for user $PM2_USER and save current processes?"; then
  pm2 startup systemd -u "$PM2_USER" --hp "$PM2_HOME" || true
  pm2 save || true
fi

echo "[i] Done. Verify services:"
echo "    - pm2 ls"
echo "    - ss -lntp | grep -E ':$PROD_PORT|:$DEV_PORT'"
echo "    - curl -I https://$PROD_DOMAIN/"
if [ -n "$DEV_CERT_DIR" ]; then
  echo "    - curl -I https://$DEV_DOMAIN/"
fi


