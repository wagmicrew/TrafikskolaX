#!/usr/bin/env bash
set -euo pipefail

# Idempotent setup script for Nginx + HTTPS + CSP embedding for Qliro checkout
#
# Defaults (override via env before running):
EMAIL="${EMAIL:-johaswe@gmail.com}"
PROD_DOMAIN="${PROD_DOMAIN:-dintrafikskolahlm.se}"
PROD_WWW_DOMAIN="${PROD_WWW_DOMAIN:-www.dintrafikskolahlm.se}"
DEV_DOMAIN="${DEV_DOMAIN:-dev.dintrafikskolaholm.se}"

PROD_UPSTREAM="${PROD_UPSTREAM:-http://127.0.0.1:3001}"
DEV_UPSTREAM="${DEV_UPSTREAM:-http://127.0.0.1:3000}"

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "[-] Missing required command: $1" >&2; exit 1; }; }

echo "[i] Using settings:" 
echo "    EMAIL=$EMAIL"
echo "    PROD_DOMAIN=$PROD_DOMAIN (www=$PROD_WWW_DOMAIN) → $PROD_UPSTREAM"
echo "    DEV_DOMAIN=$DEV_DOMAIN → $DEV_UPSTREAM"

echo "[+] Ensuring prerequisites..."
need_cmd sudo
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx || true

echo "[i] Nginx version: $(nginx -v 2>&1)"
echo "[i] Certbot version: $(certbot --version 2>/dev/null || echo 'not installed')"

backup_if_exists() {
  local path="$1"
  if [[ -f "$path" ]]; then
    local ts
    ts="$(date +%Y%m%d_%H%M%S)"
    sudo cp -f "$path" "${path}.bak_${ts}"
    echo "[i] Backed up $path -> ${path}.bak_${ts}"
  fi
}

echo "[+] Preparing Nginx site directories..."
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

PROD_CONF="/etc/nginx/sites-available/${PROD_DOMAIN}.conf"
DEV_CONF="/etc/nginx/sites-available/${DEV_DOMAIN}.conf"

backup_if_exists "$PROD_CONF"
backup_if_exists "$DEV_CONF"

echo "[+] Writing Nginx server blocks (prod)..."
sudo tee "$PROD_CONF" >/dev/null <<EOF
server {
  listen 80;
  server_name ${PROD_DOMAIN} ${PROD_WWW_DOMAIN};
  return 301 https://\$host\$request_uri;
}
server {
  listen 443 ssl http2;
  server_name ${PROD_DOMAIN} ${PROD_WWW_DOMAIN};

  # SSL will be configured by certbot below
  # CSP headers: allow our origins to be framed by our own domains and allow Qliro as frame-src
  # Do NOT set X-Frame-Options for cross-origin use; rely on frame-ancestors
  add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self' https://${PROD_DOMAIN} https://${PROD_WWW_DOMAIN} https://${DEV_DOMAIN}; frame-src 'self' https://*.qliro.com; child-src 'self' https://*.qliro.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.qliro.com; style-src 'self' 'unsafe-inline' https://*.qliro.com; img-src 'self' data: https://*.qliro.com; connect-src 'self' https://*.qliro.com" always;

  location / {
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_pass ${PROD_UPSTREAM};
  }
}
EOF

echo "[+] Writing Nginx server blocks (dev)..."
sudo tee "$DEV_CONF" >/dev/null <<EOF
server {
  listen 80;
  server_name ${DEV_DOMAIN};
  return 301 https://\$host\$request_uri;
}
server {
  listen 443 ssl http2;
  server_name ${DEV_DOMAIN};

  # SSL will be configured by certbot below
  # CSP headers: allow our origins to be framed by our own domains and allow Qliro as frame-src
  add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self' https://${DEV_DOMAIN} https://${PROD_DOMAIN} https://${PROD_WWW_DOMAIN}; frame-src 'self' https://*.qliro.com; child-src 'self' https://*.qliro.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.qliro.com; style-src 'self' 'unsafe-inline' https://*.qliro.com; img-src 'self' data: https://*.qliro.com; connect-src 'self' https://*.qliro.com" always;

  location / {
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_pass ${DEV_UPSTREAM};
  }
}
EOF
echo "[+] Enabling sites..."
sudo ln -sf "$PROD_CONF" "/etc/nginx/sites-enabled/${PROD_DOMAIN}.conf"
sudo ln -sf "$DEV_CONF" "/etc/nginx/sites-enabled/${DEV_DOMAIN}.conf"

echo "[+] Testing Nginx configuration..."
sudo nginx -t
echo "[+] Reloading Nginx..."
sudo systemctl reload nginx

echo "[+] Requesting/renewing certificates with Certbot..."
sudo certbot --nginx --non-interactive --agree-tos -m "${EMAIL}" -d ${PROD_DOMAIN} -d ${PROD_WWW_DOMAIN} || true
sudo certbot --nginx --non-interactive --agree-tos -m "${EMAIL}" -d ${DEV_DOMAIN} || true

echo "[+] Final Nginx test & reload..."
sudo nginx -t
sudo systemctl reload nginx

# --- PM2 & port checks ------------------------------------------------------
echo "[i] Checking PM2 and listening processes on ports..."
if command -v pm2 >/dev/null 2>&1; then
  echo "[i] PM2 detected: $(pm2 -v)"
  echo "[i] PM2 process list:"; pm2 list || true
else
  echo "[!] PM2 not found. Install with: npm i -g pm2" >&2
fi

port_pid() {
  local port="$1"
  # Try ss first, fallback to lsof
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v P=":$port" '$4 ~ P {print $7}' | sed -E 's/.*,pid=([0-9]+).*/\1/' | head -n1
  elif command -v lsof >/dev/null 2>&1; then
    lsof -i :"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1
  fi
}

for P in 3000 3001; do
  PID="$(port_pid "$P" || true)"
  if [[ -n "${PID:-}" ]]; then
    echo "[i] Port $P is LISTENING by PID=$PID"
    if command -v pm2 >/dev/null 2>&1; then
      # Attempt to map PID to PM2 process via jlist
      if pm2 jlist >/dev/null 2>&1; then
        NAME="$(pm2 jlist | sed 's/\\n/\n/g' | awk -v pid="$PID" 'BEGIN{ RS="{"; FS="\n" } $0 ~ /"pid"\s*:\s*"?"?pid/ { for (i=1;i<=NF;i++){ if($i ~ /"name"/){ gsub(/[",]/, "", $i); split($i,a,":"); print a[2]; break } } }' | head -n1)"
        if [[ -n "${NAME:-}" ]]; then
          echo "[i] Port $P appears to be served by PM2 process: $NAME"
        else
          echo "[!] Could not map PID $PID on port $P to a PM2 process (mapping is best-effort)."
        fi
      fi
    fi
  else
    echo "[!] Port $P is NOT listening. Ensure your Next.js app is running (PM2 or otherwise)."
  fi
done

cat <<NOTE
Done.

- CSP frame-ancestors configured for:
  - https://${PROD_DOMAIN}, https://${PROD_WWW_DOMAIN}, https://${DEV_DOMAIN}
- Qliro iframes allowed via frame-src/child-src https://*.qliro.com
- No X-Frame-Options header is set here, to enable cross-origin embedding per CSP.
- If using a CDN or other reverse proxy, ensure it does NOT inject X-Frame-Options: DENY.

You can adjust CSP in:
  $PROD_CONF
  $DEV_CONF

Then run:
  sudo nginx -t && sudo systemctl reload nginx

PM2 mapping:
  - This script checked port listeners (3000/3001) and attempted to map listening PIDs to PM2 processes.
  - If unmapped or not listening, start your apps via PM2 (example):
      pm2 start "npm run start" --name trafikskola-dev -- --port 3000
      pm2 start "npm run start" --name trafikskola-prod -- --port 3001
      pm2 save
NOTE


