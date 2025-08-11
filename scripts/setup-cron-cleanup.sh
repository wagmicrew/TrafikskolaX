#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo ./scripts/setup-cron-cleanup.sh https://yourdomain.com CRON_SECRET_VALUE

APP_URL="${1:-}"
CRON_SECRET="${2:-}"

if [[ -z "$APP_URL" || -z "$CRON_SECRET" ]]; then
  echo "Usage: $0 <APP_URL> <CRON_SECRET>"
  exit 1
fi

CRON_CMD="curl -s -X POST -H 'Authorization: Bearer ${CRON_SECRET}' ${APP_URL}/api/booking/cleanup-expired >/dev/null 2>&1"

# Write cron entry to /etc/cron.d
CRON_FILE="/etc/cron.d/trafikskolax-cleanup"
echo "*/10 * * * * root ${CRON_CMD}" | sudo tee ${CRON_FILE} >/dev/null
sudo chmod 0644 ${CRON_FILE}
sudo crontab -l >/dev/null 2>&1 || true
sudo systemctl restart cron || sudo service cron restart

echo "Cron job installed to run every 10 minutes (cleanup expired temp orders)."



