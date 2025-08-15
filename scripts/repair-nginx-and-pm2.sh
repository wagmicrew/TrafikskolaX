#!/usr/bin/env bash
set -euo pipefail

# Repair Nginx + PM2 for DinTrafikskola: rebuild site conf (HTTPS-only), fix ports, add WS headers,
# kill all PM2 apps and relaunch prod/dev on 3000/3001, and reload Nginx.

# Defaults (override via args or env)
BASE_DOMAIN=${BASE_DOMAIN:-dintrafikskolahlm.se}
DEV_HOST=${DEV_HOST:-dev.${BASE_DOMAIN}}
WWW_HOST=${WWW_HOST:-www.${BASE_DOMAIN}}
SITE_NAME=${SITE_NAME:-dintrafikskolahlm_all}
PROD_DIR=${PROD_DIR:-/var/www/dintrafikskolax_prod}
DEV_DIR=${DEV_DIR:-/var/www/dintrafikskolax_dev}
PROD_PORT=${PROD_PORT:-3000}
DEV_PORT=${DEV_PORT:-3001}
PM2_APP_PROD=${PM2_APP_PROD:-trafikskolax-prod}
PM2_APP_DEV=${PM2_APP_DEV:-trafikskolax-dev}
CERTBOT_EMAIL=${CERTBOT_EMAIL:-admin@${BASE_DOMAIN#www.}}
YES=${YES:-false}

SITES_AVAILABLE=${SITES_AVAILABLE:-/etc/nginx/sites-available}
SITES_ENABLED=${SITES_ENABLED:-/etc/nginx/sites-enabled}

need() { command -v "$1" >/dev/null 2>&1 || { echo "[-] Missing command: $1" >&2; exit 1; }; }

usage() {
  cat <<USG
Usage: sudo bash $0 [--yes] \
  [--base-domain dintrafikskolahlm.se] [--dev-host dev.dintrafikskolahlm.se] [--www-host www.dintrafikskolahlm.se] \
  [--prod-dir /var/www/dintrafikskolax_prod] [--dev-dir /var/www/dintrafikskolax_dev] \
  [--prod-port 3000] [--dev-port 3001] [--site-name dintrafikskolahlm_all] [--certbot-email you@example.com]
USG
}

confirm() {
  local prompt="$1"
  if [ "$YES" = "true" ]; then echo "[i] $prompt (auto-yes)"; return 0; fi
  read -r -p "$prompt [y/N]: " r || true
  case "$r" in y|Y|yes|YES) return 0;; *) return 1;; esac
}

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
    --certbot-email) CERTBOT_EMAIL="$2"; shift 2;;
    --help|-h) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

need nginx; need certbot; need pm2; need node; need npm

echo "[i] Preparing certificates (nginx plugin)"
certbot --nginx --non-interactive --agree-tos -m "$CERTBOT_EMAIL" -d "$BASE_DOMAIN" -d "$WWW_HOST" || true
certbot --nginx --non-interactive --agree-tos -m "$CERTBOT_EMAIL" -d "$DEV_HOST" || true

PROD_CERT_DIR="/etc/letsencrypt/live/$BASE_DOMAIN"
DEV_CERT_DIR="/etc/letsencrypt/live/$DEV_HOST"

if [ ! -d "$PROD_CERT_DIR" ]; then echo "[-] Missing cert dir: $PROD_CERT_DIR" >&2; exit 1; fi

CONF_PATH="$SITES_AVAILABLE/$SITE_NAME.conf"
[ -f "$CONF_PATH" ] && cp -a "$CONF_PATH" "$CONF_PATH.$(date +%F_%H%M%S).bak" && echo "[i] Backup: $CONF_PATH.*.bak"

cat >"$CONF_PATH" <<EOF
# Managed by repair-nginx-and-pm2.sh

# Map for websocket Connection header
map \$http_upgrade \$connection_upgrade { default upgrade; '' close; }

server {
    listen 80;
    server_name $BASE_DOMAIN $WWW_HOST $DEV_HOST;
    return 301 https://\$host\$request_uri;
}

# DEV 443
server {
    listen 443 ssl;
    server_name $DEV_HOST;

    ssl_certificate     $DEV_CERT_DIR/fullchain.pem;
    ssl_certificate_key $DEV_CERT_DIR/privkey.pem;
    ssl_stapling off;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 50m;

    add_header Content-Security-Policy "
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://checkout.qliro.com https://*.qliro.com https://qit.nu https://*.qit.nu;
      frame-src https://checkout.qliro.com https://*.qliro.com;
      connect-src 'self' https://*.qliro.com https://qit.nu https://*.qit.nu;
      img-src 'self' data: https:;
      font-src 'self' https://fonts.gstatic.com https://qit.nu https://*.qit.nu;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      base-uri 'self';
      frame-ancestors 'self';
    " always;

    location / {
        proxy_pass http://127.0.0.1:$DEV_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Request-ID \$request_id;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
        send_timeout 120s;
    }
}

# PROD 443
server {
    listen 443 ssl;
    server_name $BASE_DOMAIN $WWW_HOST;

    ssl_certificate     $PROD_CERT_DIR/fullchain.pem;
    ssl_certificate_key $PROD_CERT_DIR/privkey.pem;
    ssl_stapling off;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 50m;

    add_header Content-Security-Policy "
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://checkout.qliro.com https://*.qliro.com https://qit.nu https://*.qit.nu https://*.$BASE_DOMAIN;
      frame-src https://checkout.qliro.com https://*.qliro.com https://*.$BASE_DOMAIN;
      connect-src 'self' https://*.qliro.com https://qit.nu https://*.qit.nu https://*.$BASE_DOMAIN;
      img-src 'self' data: https:;
      font-src 'self' https://fonts.gstatic.com https://qit.nu https://*.qit.nu https://*.$BASE_DOMAIN;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      base-uri 'self';
      frame-ancestors 'self';
    " always;

    location / {
        proxy_pass http://127.0.0.1:$PROD_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Request-ID \$request_id;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
        send_timeout 120s;
    }
}
EOF

ln -sf "$CONF_PATH" "$SITES_ENABLED/$(basename "$CONF_PATH")"

echo "[i] Disabling conflicting site symlinks for $BASE_DOMAIN / $WWW_HOST / $DEV_HOST"
for f in "$SITES_ENABLED"/*; do
  [ -e "$f" ] || continue
  [[ "$f" == *"$(basename "$CONF_PATH")" ]] && continue
  if grep -Eqs "server_name\s+.*($BASE_DOMAIN|$WWW_HOST|$DEV_HOST)" "$f"; then
    echo " - $(basename "$f")"
    rm -f "$f"
  fi
done

echo "[i] Testing and reloading nginx"
nginx -t && systemctl reload nginx || systemctl start nginx

echo "[i] Killing all PM2 apps"
pm2 delete all || true

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

start_next_prod "$PROD_DIR"
start_next_dev "$DEV_DIR"
pm2 save

echo "[i] Done. Verify:"
echo "    pm2 ls"
echo "    ss -lntp | grep -E ':$PROD_PORT|:$DEV_PORT' | cat"
echo "    sudo nginx -t && sudo systemctl reload nginx"


