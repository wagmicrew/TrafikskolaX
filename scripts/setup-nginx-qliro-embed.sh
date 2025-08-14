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

# Optional build/update variables
DEV_APP_DIR="${DEV_APP_DIR:-/var/www/dintrafikskolax_dev}"
DEV_GIT_BRANCH="${DEV_GIT_BRANCH:-main}"
DEV_RUN_BUILD="${DEV_RUN_BUILD:-1}"
PM2_DEV_NAME="${PM2_DEV_NAME:-}"  # e.g., trafikskola-dev

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

## --- Dev App update & build -------------------------------------------------
if [[ "${DEV_RUN_BUILD}" == "1" ]]; then
  echo "[+] Updating & building DEV app at ${DEV_APP_DIR} (branch=${DEV_GIT_BRANCH})..."
  if [[ -d "${DEV_APP_DIR}" ]]; then
    pushd "${DEV_APP_DIR}" >/dev/null || { echo "[-] Cannot cd to ${DEV_APP_DIR}" >&2; exit 1; }
    if [[ -d .git ]]; then
      echo "[i] Git status before update:"; git status --porcelain || true
      git fetch --all --tags || true
      git checkout "${DEV_GIT_BRANCH}" || true
      git pull --rebase || true
    else
      echo "[!] No git repository detected at ${DEV_APP_DIR} — skipping fetch/pull"
    fi
    if command -v corepack >/dev/null 2>&1; then corepack enable || true; fi
    if [[ -f package.json ]]; then
      if command -v npm >/dev/null 2>&1; then
        echo "[i] Installing deps..."; npm ci || npm install
        echo "[i] Building app..."; npm run build
      else
        echo "[!] npm not found; skipping build" >&2
      fi
    else
      echo "[!] package.json not found; skipping build"
    fi
    popd >/dev/null || true
  else
    echo "[!] DEV_APP_DIR=${DEV_APP_DIR} does not exist; skipping update/build"
  fi
fi

## --- PM2 restart (dev) -----------------------------------------------------
if command -v pm2 >/dev/null 2>&1; then
  if [[ -n "${PM2_DEV_NAME}" ]]; then
    echo "[+] Restarting PM2 dev process: ${PM2_DEV_NAME}"
    pm2 restart "${PM2_DEV_NAME}" || echo "[!] Failed to restart PM2 process ${PM2_DEV_NAME}"
    pm2 save || true
  else
    echo "[i] No PM2_DEV_NAME set; attempting restart by port mapping (3000)"
    PID3000="$(port_pid 3000 || true)"
    if [[ -n "${PID3000:-}" ]]; then
      PROC_ID="$(pm2 jlist | sed 's/\\n/\n/g' | awk -v pid="$PID3000" 'BEGIN{ RS="{"; FS="\n" } $0 ~ /"pid"\s*:\s*"?"?pid/ { for (i=1;i<=NF;i++){ if($i ~ /"pm_id"/){ gsub(/[^0-9]/, "", $i); print $i; break } } }' | head -n1)"
      if [[ -n "${PROC_ID:-}" ]]; then
        pm2 restart "${PROC_ID}" || echo "[!] Failed to restart PM2 process id ${PROC_ID}"
        pm2 save || true
      else
        echo "[!] Could not resolve PM2 process by port 3000; please restart manually (set PM2_DEV_NAME to automate)."
      fi
    else
      echo "[!] Nothing listening on port 3000; start your dev app then rerun or set PM2_DEV_NAME."
    fi
  fi
fi

## --- Nginx flow checks -----------------------------------------------------
echo "[+] Verifying Nginx endpoints & headers..."
check_url() {
  local url="$1"
  echo "[i] Checking: $url"
  local code
  code="$(curl -k -s -o /dev/null -w "%{http_code}" -I "$url")"
  echo "    HTTP $code"
  echo "    Headers (CSP/XFO):"
  curl -k -s -I "$url" | (grep -iE 'content-security-policy|x-frame-options' || true)
}

check_url "https://${PROD_DOMAIN}"
check_url "https://${PROD_WWW_DOMAIN}"
check_url "https://${DEV_DOMAIN}"

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


