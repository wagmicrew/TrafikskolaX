#!/usr/bin/env bash
set -euo pipefail

# Align dev PM2/Nginx setup with deploy-enhanced.sh conventions

# Config (match deploy-enhanced.sh)
PROJECT_NAME="dintrafikskolax"
DEV_DOMAIN="dev.dintrafikskolahlm.se"
DEV_PORT="3000"
DEV_DIR="/var/www/${PROJECT_NAME}_dev"
ECOSYSTEM_FILE="/var/www/${PROJECT_NAME}_prod/ecosystem.config.js"

log() { echo -e "\033[36m[fix-dev]\033[0m $*"; }
ok() { echo -e "\033[32m[ok]\033[0m $*"; }
warn() { echo -e "\033[33m[warn]\033[0m $*"; }
err() { echo -e "\033[31m[err]\033[0m $*"; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || { err "missing $1"; exit 1; }; }

main() {
  export DEBIAN_FRONTEND=noninteractive
  log "Ensuring system deps (curl, git, nginx)"
  apt-get update -y >/dev/null 2>&1 || true
  apt-get install -y curl git ca-certificates nginx >/dev/null 2>&1 || true

  log "Ensuring Node.js and PM2"
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs build-essential
  fi
  if ! command -v pm2 >/dev/null 2>&1; then
    npm install -g pm2
  fi

  require_cmd pm2

  # Ensure dev directory exists
  if [ ! -d "$DEV_DIR" ]; then
    err "Dev directory $DEV_DIR not found. Clone your repo to this path or run deploy-enhanced.sh for dev."
    exit 1
  fi

  log "Installing/updating dependencies in $DEV_DIR"
  cd "$DEV_DIR"
  # Prefer install (dev environment), keep lock if present
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund || (npm cache clean --force && npm ci --no-audit --no-fund)
  else
    npm install --no-audit --no-fund || (npm cache clean --force && npm install --no-audit --no-fund)
  fi

  # Ensure ecosystem contains dev app per deploy-enhanced
  if [ ! -f "$ECOSYSTEM_FILE" ]; then
    log "Ecosystem file not found at $ECOSYSTEM_FILE, creating minimal dev ecosystem"
    mkdir -p "/var/www/${PROJECT_NAME}_prod"
    cat > "$ECOSYSTEM_FILE" <<EOF
module.exports = {
  apps: [
    {
      name: '${PROJECT_NAME}-dev',
      cwd: '${DEV_DIR}',
      script: 'npm',
      args: 'run dev',
      env: { NODE_ENV: 'development', PORT: ${DEV_PORT} },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/${PROJECT_NAME}-dev-error.log',
      out_file: '/var/log/pm2/${PROJECT_NAME}-dev-out.log',
      log_file: '/var/log/pm2/${PROJECT_NAME}-dev-combined.log',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
EOF
  else
    log "Ecosystem file exists; will (re)start ${PROJECT_NAME}-dev from it"
  fi

  # Start or restart dev app
  log "Starting dev app with PM2"
  pm2 delete "${PROJECT_NAME}-dev" >/dev/null 2>&1 || true
  pm2 start "$ECOSYSTEM_FILE" --only "${PROJECT_NAME}-dev"
  pm2 save >/dev/null 2>&1 || true

  # PM2 startup on boot
  PM2_USER=${SUDO_USER:-$USER}
  pm2 startup systemd -u "$PM2_USER" --hp "/home/$PM2_USER" >/dev/null 2>&1 || true
  pm2 save >/dev/null 2>&1 || true

  # Nginx for dev domain → proxy to DEV_PORT
  log "Configuring Nginx for $DEV_DOMAIN → 127.0.0.1:${DEV_PORT}"
  DEV_SITE="/etc/nginx/sites-available/${PROJECT_NAME}-dev"
  cat > "$DEV_SITE" <<CONF
server {
  listen 80;
  server_name ${DEV_DOMAIN};

  location / {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:${DEV_PORT};
  }

  access_log /var/log/nginx/${PROJECT_NAME}-dev-access.log;
  error_log  /var/log/nginx/${PROJECT_NAME}-dev-error.log;
}
CONF
  ln -sf "$DEV_SITE" "/etc/nginx/sites-enabled/${PROJECT_NAME}-dev"
  nginx -t
  systemctl reload nginx

  ok "Dev PM2 process '${PROJECT_NAME}-dev' and Nginx for ${DEV_DOMAIN} are configured."
  pm2 status | cat
}

main "$@"


