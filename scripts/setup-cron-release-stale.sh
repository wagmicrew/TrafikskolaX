#!/usr/bin/env bash
set -euo pipefail

# Install a cron entry to call the maintenance endpoint every 15 minutes.
# Requires MAINTENANCE_TOKEN to be present in the environment of the app (e.g., .env or systemd unit).

APP_URL=${APP_URL:-https://dintrafikskolahlm.se}
TOKEN=${TOKEN:-${MAINTENANCE_TOKEN:-}}
MINUTES=${MINUTES:-15}

if [ -z "$TOKEN" ]; then
  echo "[-] Missing TOKEN (or MAINTENANCE_TOKEN) env var" >&2
  exit 1
fi

LINE="*/${MINUTES} * * * * curl -fsS '${APP_URL}/api/admin/maintenance/release-stale?token=${TOKEN}&minutes=${MINUTES}' >/dev/null 2>&1"

# Install for root crontab
(crontab -l 2>/dev/null | grep -v "/api/admin/maintenance/release-stale"; echo "$LINE") | crontab -

echo "[i] Cron installed: $LINE"


