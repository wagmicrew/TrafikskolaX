#!/usr/bin/env bash
set -euo pipefail

# Installer for the generic Server Administration tool (Ubuntu)

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Please run as root (use sudo)." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/5] Installing base packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates nginx redis-server postgresql-client

echo "[2/5] Ensuring Node.js and PM2..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs build-essential
fi
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

echo "[3/5] Installing server-admin CLI to /usr/local/bin..."
install -m 0755 "$SCRIPT_DIR/server-admin.sh" /usr/local/bin/server-admin

echo "[4/5] Adding login hint in /etc/profile.d/10-server-admin.sh ..."
cat >/etc/profile.d/10-server-admin.sh <<'PROFILE'
# Server Admin quick help on login (interactive shells)
if [ -n "$PS1" ]; then
  echo -e "\033[1mServer Admin Quick Commands\033[0m"
  echo "  server-admin deploy                 # Fetch+Build+PM2 reload/start"
  echo "  server-admin pm2 status|logs        # PM2 status/logs"
  echo "  server-admin nginx test|reload|status|logs"
  echo "  server-admin git status|pull|branches"
  echo "  server-admin node info              # node/npm/pm2 versions"
  echo "  server-admin redis status|logs|restart|ping"
  echo "  server-admin cron list              # Show user crontab"
  echo "  server-admin db test                # Test Neon/Postgres connection"
  echo "  alias sa='server-admin'"
  echo
fi
PROFILE
chmod 0644 /etc/profile.d/10-server-admin.sh

echo "[5/5] Optional: configure PM2 startup (recommended) ..."
PM2_USER=${SUDO_USER:-$USER}
su - "$PM2_USER" -c "pm2 startup systemd -u $PM2_USER --hp /home/$PM2_USER >/dev/null 2>&1 || true"

echo
echo "Done. Next steps:"
echo "- Set APP_DIR and PM2_APP_NAME if needed, e.g.:"
echo "    sudo sh -c 'echo APP_DIR=/var/www/app >> /etc/environment'"
echo "    sudo sh -c 'echo PM2_APP_NAME=myapp-prod >> /etc/environment'"
echo "- Put your .env (with DATABASE_URL for Neon) inside \$APP_DIR/.env"
echo "- Re-login to see the quick command hints, or run: source /etc/profile.d/10-server-admin.sh"
echo
echo "Usage examples:"
echo "  server-admin deploy"
echo "  server-admin pm2 status"
echo "  server-admin nginx reload"
echo "  server-admin db test"


