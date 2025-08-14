#!/usr/bin/env bash
set -euo pipefail

# Setup/Update Nginx headers for Qliro checkout embedding and cross-ref/tracing headers
# - Clears X-Frame-Options and uses CSP frame-ancestors for allowed frames
# - Adds modern security headers (Referrer-Policy, Permissions-Policy, X-Content-Type-Options)
# - Adds cross-origin policies (COOP/COEP/CORP)
# - Adds/forwards request tracing headers (X-Request-ID, X-Real-IP, X-Forwarded-*)
# - Optional CORS allow based on configured domains
# - Idempotent with backups
#
# Variables (override via env or inline):
#   SITE_NAME=dintrafikskolax
#   PRIMARY_DOMAIN=www.dintrafikskolahlm.se
#   EXTRA_DOMAINS="dintrafikskolahlm.se dev.dintrafikskolaholm.se"
#   APP_UPSTREAM=127.0.0.1:3000
#   ENABLE_CERTBOT=false           # set true to request/renew certs
#   CERTBOT_EMAIL=admin@example.com

SITE_NAME=${SITE_NAME:-dintrafikskolax}
PRIMARY_DOMAIN=${PRIMARY_DOMAIN:-www.dintrafikskolahlm.se}
EXTRA_DOMAINS=${EXTRA_DOMAINS:-dintrafikskolahlm.se dev.dintrafikskolaholm.se}
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

cat >"$CONF_PATH.new" <<'EOF'
# Managed by setup-nginx-qliro-headers.sh

map \\$http_origin \\$cors_allow_origin {
    default "";
EOF
for d in $DOMAINS; do
  echo "    \"https://$d\" \"https://$d\";" >>"$CONF_PATH.new"
done
cat >>"$CONF_PATH.new" <<'EOF'
}

log_format request_with_id '$remote_addr - $remote_user [$time_local] "$request" '
                               '$status $body_bytes_sent "$http_referer" "$http_user_agent" '
                               'req_id=$request_id upstream=$upstream_addr rt=$request_time';

server {
    listen 80;
    server_name SERVER_NAMES_REPLACE;
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name SERVER_NAMES_REPLACE;

    # SSL assumed already provisioned (use --enable-certbot to request)
    ssl_certificate     /etc/letsencrypt/live/PRIMARY_REPLACE/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/PRIMARY_REPLACE/privkey.pem;

    # Proxy upstream
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
    # Do not send legacy X-Frame-Options; control framing via CSP frame-ancestors
    more_clear_headers 'X-Frame-Options';

    # Content Security Policy allowing Qliro frames
    add_header Content-Security-Policy "default-src 'self' https: data: blob:; \
      frame-ancestors 'self' https://*.qliro.com https://qliro.com; \
      frame-src https://*.qliro.com; \
      child-src https://*.qliro.com; \
      connect-src 'self' https:; \
      img-src 'self' https: data: blob:; \
      style-src 'self' 'unsafe-inline' https:; \
      script-src 'self' https: 'unsafe-inline';" always;

    # Modern headers
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "0" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Cross-Origin policies (COOP/COEP/CORP)
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Resource-Policy "same-site" always;

    # CORS (allow same-site origins only)
    if ($cors_allow_origin != "") {
        add_header 'Access-Control-Allow-Origin' $cors_allow_origin always;
        add_header 'Vary' 'Origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET,POST,PUT,PATCH,DELETE,OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type,Accept,X-Requested-With,X-Request-ID' always;
    }
    if ($request_method = OPTIONS) {
        return 204;
    }
}
EOF

# Replace placeholders
sed -i "s/SERVER_NAMES_REPLACE/$SERVER_NAMES/g" "$CONF_PATH.new"
sed -i "s#APP_UPSTREAM_REPLACE#$APP_UPSTREAM#g" "$CONF_PATH.new"
sed -i "s/SITE_NAME_REPLACE/$SITE_NAME/g" "$CONF_PATH.new"
sed -i "s/PRIMARY_REPLACE/$PRIMARY_DOMAIN/g" "$CONF_PATH.new"

# Ensure nginx-extras for more_clear_headers
if ! nginx -V 2>&1 | grep -q -- '--with-http_headers_more_module'; then
  if apt-cache show nginx-extras >/dev/null 2>&1; then
    echo "[i] Installing nginx-extras for headers_more..."
    apt-get update && apt-get install -y nginx-extras
  else
    echo "[!] headers_more module not available; X-Frame-Options may not be clearable."
  fi
fi

# Backup existing
if [ -f "$CONF_PATH" ]; then
  cp -a "$CONF_PATH" "$BACKUP_PATH"
  echo "[i] Backed up existing config to $BACKUP_PATH"
fi
mv -f "$CONF_PATH.new" "$CONF_PATH"

# Symlink
ln -sf "$CONF_PATH" "$SITES_ENABLED/$CONF_NAME"

# Certbot (optional)
if [ "$ENABLE_CERTBOT" = "true" ]; then
  NEED certbot
  echo "[i] Requesting/renewing certs for: $SERVER_NAMES"
  certbot --nginx --non-interactive --agree-tos -m "$CERTBOT_EMAIL" -d "$PRIMARY_DOMAIN" $(for d in $EXTRA_DOMAINS; do printf ' -d %s' "$d"; done)
fi

# Test and reload
nginx -t
systemctl reload nginx

echo "[i] Deployed $CONF_PATH"
echo "[i] Checking headers..."
set +e
curl -skI https://$PRIMARY_DOMAIN/ | awk 'BEGIN{print "--- Response Headers ---"} {print}' | sed -n '1,200p'
set -e

echo "[i] Done."


