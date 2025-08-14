#!/usr/bin/env bash
set -euo pipefail

# Nginx auto-fix for DinTrafikskola (headers, cert paths, conflicts, reload)
# - Writes a safe site config with CSP and tracing headers
# - Selects an existing cert path automatically (apex if www missing)
# - Optionally requests certs (standalone) if none exist
# - Disables conflicting server_name sites in sites-enabled
# - Starts or reloads nginx

# Inputs
SITE_NAME=${SITE_NAME:-dintrafikskolax}
PRIMARY_DOMAIN=${PRIMARY_DOMAIN:-dintrafikskolahlm.se}
EXTRA_DOMAINS=${EXTRA_DOMAINS:-www.dintrafikskolahlm.se dev.dintrafikskolaholm.se}
APP_UPSTREAM=${APP_UPSTREAM:-127.0.0.1:3000}
ENABLE_CERTBOT=${ENABLE_CERTBOT:-false}
CERTBOT_EMAIL=${CERTBOT_EMAIL:-admin@${PRIMARY_DOMAIN#www.}}

NEED() { command -v "$1" >/dev/null 2>&1 || { echo "[-] Missing command: $1" >&2; exit 1; }; }
NEED nginx

SITES_AVAILABLE=/etc/nginx/sites-available
SITES_ENABLED=/etc/nginx/sites-enabled
CONF_NAME="$SITE_NAME.conf"
CONF_PATH="$SITES_AVAILABLE/$CONF_NAME"
BACKUP_PATH="$CONF_PATH.$(date +%F_%H%M%S).bak"

DOMAINS="$PRIMARY_DOMAIN $EXTRA_DOMAINS"
SERVER_NAMES=$(echo "$DOMAINS" | xargs)

# Pick an existing cert directory for the primary (fallback to apex if www missing)
pick_cert_dir() {
  local d="$1"
  if [ -d "/etc/letsencrypt/live/$d" ]; then
    echo "/etc/letsencrypt/live/$d"
    return 0
  fi
  # If www.* try apex
  if [[ "$d" == www.* ]]; then
    local apex="${d#www.}"
    if [ -d "/etc/letsencrypt/live/$apex" ]; then
      echo "/etc/letsencrypt/live/$apex"
      return 0
    fi
  fi
  # Try any directory that matches the base domain
  local base="$d"
  for cand in /etc/letsencrypt/live/*; do
    [ -d "$cand" ] || continue
    case "$cand" in
      *"$base"*) echo "$cand"; return 0;;
    esac
  done
  echo ""; return 1
}

CERT_DIR="$(pick_cert_dir "$PRIMARY_DOMAIN" || true)"
if [ -z "$CERT_DIR" ] && [ "$ENABLE_CERTBOT" = "true" ]; then
  NEED certbot
  echo "[i] No existing cert found for $PRIMARY_DOMAIN – requesting via standalone certbot..."
  systemctl stop nginx || true
  certbot certonly --standalone -d "$PRIMARY_DOMAIN" $(for d in $EXTRA_DOMAINS; do printf ' -d %s' "$d"; done) \
    -m "$CERTBOT_EMAIL" --agree-tos --non-interactive || true
  systemctl start nginx || true
  CERT_DIR="$(pick_cert_dir "$PRIMARY_DOMAIN" || true)"
fi

if [ -z "$CERT_DIR" ]; then
  echo "[!] Could not find certificate directory for $PRIMARY_DOMAIN. Run certbot or adjust PRIMARY_DOMAIN."
  exit 1
fi

echo "[i] Using certificate directory: $CERT_DIR"

# Disable conflicting enabled sites referencing our domains (keep files in sites-available)
echo "[i] Scanning for conflicting server_name sites..."
for f in "$SITES_ENABLED"/*; do
  [ -e "$f" ] || continue
  # skip if it's our file
  if [[ "$f" == *"$CONF_NAME" ]]; then continue; fi
  if grep -Eqs "server_name\s+.*($(echo $DOMAINS | sed 's/ /|/g'))" "$f"; then
    echo "[i] Disabling conflict: $(basename "$f")"
    rm -f "$f"
  fi
done

# Generate config
cat >"$CONF_PATH.new" <<'EOF'
# Managed by nginx-auto-fix.sh

map $http_origin $cors_allow_origin {
    default "";
}

log_format request_with_id '$remote_addr - $remote_user [$time_local] "$request" '
                               '$status $body_bytes_sent "$http_referer" "$http_user_agent" '
                               'req_id=$request_id upstream=$upstream_addr rt=$request_time';

server {
    listen 80;
    server_name SERVER_NAMES_REPLACE;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name SERVER_NAMES_REPLACE;

    ssl_certificate     CERT_DIR_REPLACE/fullchain.pem;
    ssl_certificate_key CERT_DIR_REPLACE/privkey.pem;
    ssl_stapling off;

    location / {
        proxy_pass http://APP_UPSTREAM_REPLACE;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        proxy_buffering off;
    }

    access_log /var/log/nginx/SITE_NAME_REPLACE.access.log request_with_id;
    error_log  /var/log/nginx/SITE_NAME_REPLACE.error.log warn;

    # --- Security & Policy Headers ---
    more_clear_headers 'X-Frame-Options';
    add_header Content-Security-Policy "default-src 'self' https: data: blob:; \
      frame-ancestors 'self' https://*.qliro.com https://qliro.com; \
      frame-src https://*.qliro.com; \
      child-src https://*.qliro.com; \
      connect-src 'self' https:; \
      img-src 'self' https: data: blob:; \
      style-src 'self' 'unsafe-inline' https:; \
      script-src 'self' https: 'unsafe-inline';" always;

    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "0" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Resource-Policy "same-site" always;

    # CORS
    add_header 'Access-Control-Allow-Origin' $cors_allow_origin always;
    add_header 'Vary' 'Origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET,POST,PUT,PATCH,DELETE,OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type,Accept,X-Requested-With,X-Request-ID' always;
}
EOF

sed -i "s/SERVER_NAMES_REPLACE/$SERVER_NAMES/g" "$CONF_PATH.new"
sed -i "s#APP_UPSTREAM_REPLACE#$APP_UPSTREAM#g" "$CONF_PATH.new"
sed -i "s#CERT_DIR_REPLACE#$CERT_DIR#g" "$CONF_PATH.new"
sed -i "s/SITE_NAME_REPLACE/$SITE_NAME/g" "$CONF_PATH.new"

# Backup and install
if [ -f "$CONF_PATH" ]; then
  cp -a "$CONF_PATH" "$BACKUP_PATH"
  echo "[i] Backed up existing config to $BACKUP_PATH"
fi
mv -f "$CONF_PATH.new" "$CONF_PATH"
ln -sf "$CONF_PATH" "$SITES_ENABLED/$CONF_NAME"

# Validate and (re)start nginx
if nginx -t; then
  if ! systemctl is-active --quiet nginx; then
    echo "[i] nginx is not active – starting..."
    systemctl start nginx
  else
    systemctl reload nginx
  fi
else
  echo "[!] nginx -t failed. See errors above." >&2
  exit 1
fi

echo "[i] Success. Active server_name: $SERVER_NAMES using cert dir: $CERT_DIR"


