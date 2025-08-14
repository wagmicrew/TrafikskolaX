#!/usr/bin/env bash
set -euo pipefail

# Reconfigure nginx to work with PM2 using ONE site file handling *.dintrafikskolahlm.se
# - dev.dintrafikskolahlm.se → PM2 app on /var/www/dintrafikskolax_dev (port 3001)
# - all other hosts (dintrafikskolahlm.se, www.dintrafikskolahlm.se, etc.) → /var/www/dintrafikskolax_prod (port 3000)
# - Creates fresh PM2 processes: dintrafikskolahlm-prod (cluster) and dintrafikskolahlm-dev (fork)
# - Obtains/uses certs for apex+www and dev via certbot --nginx (no HTTP/2)

########################################
# Defaults (override via args/env)
########################################
BASE_DOMAIN=${BASE_DOMAIN:-dintrafikskolahlm.se}
DEV_HOST=${DEV_HOST:-dev.${BASE_DOMAIN}}
WWW_HOST=${WWW_HOST:-www.${BASE_DOMAIN}}

PROD_DIR=${PROD_DIR:-/var/www/dintrafikskolax_prod}
DEV_DIR=${DEV_DIR:-/var/www/dintrafikskolax_dev}
PROD_PORT=${PROD_PORT:-3000}
DEV_PORT=${DEV_PORT:-3001}

SITE_NAME=${SITE_NAME:-dintrafikskolahlm_all}
SITES_AVAILABLE=${SITES_AVAILABLE:-/etc/nginx/sites-available}
SITES_ENABLED=${SITES_ENABLED:-/etc/nginx/sites-enabled}

PM2_APP_PROD=${PM2_APP_PROD:-dintrafikskolahlm-prod}
PM2_APP_DEV=${PM2_APP_DEV:-dintrafikskolahlm-dev}
PM2_USER=${PM2_USER:-$(whoami)}
PM2_HOME=${PM2_HOME:-$(getent passwd "$PM2_USER" | cut -d: -f6)}

CERTBOT_EMAIL=${CERTBOT_EMAIL:-admin@${BASE_DOMAIN#www.}}
YES=${YES:-false}

########################################
# Helpers
########################################
need() { command -v "$1" >/dev/null 2>&1 || { echo "[-] Missing command: $1" >&2; exit 1; }; }

usage() {
  cat <<USG
Usage: sudo bash $0 [--yes] \
  [--base-domain dintrafikskolahlm.se] [--dev-host dev.dintrafikskolahlm.se] [--www-host www.dintrafikskolahlm.se] \
  [--prod-dir /var/www/dintrafikskolax_prod] [--dev-dir /var/www/dintrafikskolax_dev] \
  [--prod-port 3000] [--dev-port 3001] [--site-name dintrafikskolahlm_all] \
  [--pm2-user root] [--certbot-email you@example.com]
USG
}

confirm() {
  local prompt="$1"
  if [ "$YES" = "true" ]; then echo "[i] $prompt (auto-yes)"; return 0; fi
  read -r -p "$prompt [y/N]: " r || true
  case "$r" in y|Y|yes|YES) return 0;; *) return 1;; esac
}

########################################
# Parse args
########################################
if [ -z "${BASH_VERSION:-}" ]; then
  echo "[-] Run with: sudo bash $0 ..." >&2
  exit 1
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --yes|-y) YES=true; shift;;
    --base-domain) BASE_DOMAIN="$2"; shift 2;;
    --dev-host) DEV_HOST="$2"; shift 2;;
    --www-host) WWW_HOST="$2"; shift 2;;
    --prod-dir) PROD_DIR="$2"; shift 2;;
    --dev-dir) DEV_DIR="$2"; shift 2;;
    --prod-port) PROD_PORT="$2"; shift 2;;
    --dev-port) DEV_PORT="$2"; shift 2;;
    --site-name) SITE_NAME="$2"; shift 2;;
    --pm2-user) PM2_USER="$2"; PM2_HOME=$(getent passwd "$PM2_USER" | cut -d: -f6); shift 2;;
    --certbot-email) CERTBOT_EMAIL="$2"; shift 2;;
    --help|-h) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

########################################
# Checks
########################################
need nginx; need certbot; need pm2; need node; need npm; need git
echo "[i] Using PM2 user: $PM2_USER (home: $PM2_HOME)"

########################################
# Certs (apex+www; dev)
########################################
ensure_cert() {
  local primary="$1"; shift
  local -a extras=("$@")
  local got
  got=$(ls -1d /etc/letsencrypt/live/* 2>/dev/null | grep -E "/${primary}$" || true)
  if [ -n "$got" ]; then echo "$primary"; return 0; fi
  echo "[i] Obtaining cert for: $primary ${extras[*]}"
  local args=(-d "$primary"); for d in "${extras[@]}"; do [ -n "$d" ] && args+=( -d "$d" ); done
  certbot --nginx --non-interactive --agree-tos -m "$CERTBOT_EMAIL" "${args[@]}" || true
  ls -1d /etc/letsencrypt/live/* 2>/dev/null | grep -qE "/${primary}$" || {
    echo "[-] Failed to obtain cert for $primary" >&2; return 1; }
  echo "$primary"
}

ensure_cert "$BASE_DOMAIN" "$WWW_HOST" >/dev/null || true
ensure_cert "$DEV_HOST" >/dev/null || true

PROD_CERT_DIR="/etc/letsencrypt/live/$BASE_DOMAIN"
DEV_CERT_DIR="/etc/letsencrypt/live/$DEV_HOST"

########################################
# Nginx: single site file, separate 443 servers (prod vs dev), one 80 redirect
########################################
CONF_PATH="$SITES_AVAILABLE/$SITE_NAME.conf"
[ -f "$CONF_PATH" ] && cp -a "$CONF_PATH" "$CONF_PATH.$(date +%F_%H%M%S).bak" && echo "[i] Backup: $CONF_PATH.*.bak"

cat >"$CONF_PATH" <<EOF
# Managed by setup-nginx-pm2-wildcard.sh

server {
    listen 80;
    server_name $BASE_DOMAIN $WWW_HOST $DEV_HOST;
    return 301 https://\$host\$request_uri;
}

# DEV 443: dev.$BASE_DOMAIN → PM2 dev on $DEV_PORT
server {
    listen 443 ssl;
    server_name $DEV_HOST;

    ssl_certificate     $DEV_CERT_DIR/fullchain.pem;
    ssl_certificate_key $DEV_CERT_DIR/privkey.pem;
    ssl_stapling off;

    client_max_body_size 50m;

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

# PROD 443: apex+www → PM2 prod on $PROD_PORT
server {
    listen 443 ssl;
    server_name $BASE_DOMAIN $WWW_HOST;

    ssl_certificate     $PROD_CERT_DIR/fullchain.pem;
    ssl_certificate_key $PROD_CERT_DIR/privkey.pem;
    ssl_stapling off;

    client_max_body_size 50m;

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

ln -sf "$CONF_PATH" "$SITES_ENABLED/$(basename "$CONF_PATH")"

# Disable other enabled site files for these domains
for f in "$SITES_ENABLED"/*; do
  [ -e "$f" ] || continue
  [[ "$f" == *"$(basename "$CONF_PATH")" ]] && continue
  if grep -Eqs "server_name\s+.*($BASE_DOMAIN|$WWW_HOST|$DEV_HOST)" "$f"; then
    echo "[i] Disabling conflicting site: $(basename "$f")"
    rm -f "$f"
  fi
done

nginx -t && systemctl reload nginx || systemctl start nginx

########################################
# PM2: ensure ONLY two apps, one prod, one dev
########################################
echo "[i] Cleaning old PM2 apps"
pm2 delete trafikskolax-prod trafikskolax-dev dintrafikskolax-prod dintrafikskolax-dev \
  "$PM2_APP_PROD" "$PM2_APP_DEV" >/dev/null 2>&1 || true

start_next_prod() {
  local path="$1"
  echo "[i] Starting $PM2_APP_PROD from $path on :$PROD_PORT (cluster)"
  pushd "$path" >/dev/null
  [ -d node_modules ] || npm ci --no-audit --no-fund
  [ -d .next ] || npm run build
  NODE_ENV=production pm2 start node_modules/next/dist/bin/next \
    --name "$PM2_APP_PROD" \
    -i max \
    -- start -p "$PROD_PORT" --hostname 127.0.0.1
  popd >/dev/null
}

start_next_dev() {
  local path="$1"
  echo "[i] Starting $PM2_APP_DEV from $path on :$DEV_PORT (fork)"
  pushd "$path" >/dev/null
  [ -d node_modules ] || npm ci --no-audit --no-fund
  NODE_ENV=development pm2 start node_modules/next/dist/bin/next \
    --name "$PM2_APP_DEV" \
    -- dev -p "$DEV_PORT" --hostname 127.0.0.1
  popd >/dev/null
}

if confirm "(Re)start PM2 apps now? ($PM2_APP_PROD and $PM2_APP_DEV)"; then
  start_next_prod "$PROD_DIR"
  start_next_dev  "$DEV_DIR"
  pm2 save
  pm2 startup systemd -u "$PM2_USER" --hp "$PM2_HOME" || true
  pm2 save || true
fi

echo "[i] Done. Verify:"
echo "    pm2 ls"
echo "    ss -lntp | grep -E ':$PROD_PORT|:$DEV_PORT'"
echo "    curl -I https://$BASE_DOMAIN/  && curl -I https://$DEV_HOST/"


