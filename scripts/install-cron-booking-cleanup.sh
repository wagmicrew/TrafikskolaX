#!/usr/bin/env bash
set -Eeuo pipefail

# Installs a crontab entry to clear inactive/temporary bookings every 15 minutes.
# It calls the protected endpoint: POST /api/booking/cleanup-expired with Authorization: Bearer $CRON_SECRET
# Usage:
#   ./scripts/install-cron-booking-cleanup.sh --app-url https://example.com --secret YOUR_CRON_SECRET [--log-file /var/log/booking-cleanup.log]
# Or via env:
#   APP_URL=https://example.com CRON_SECRET=secret ./scripts/install-cron-booking-cleanup.sh

APP_URL="${APP_URL:-}"
CRON_SECRET="${CRON_SECRET:-}"
LOG_FILE="${LOG_FILE:-}"

print_usage() {
  cat <<EOF
Install cron job for booking cleanup (runs every 15 minutes)

Required:
  --app-url URL         Public app URL (https), e.g. https://www.dintrafikskolahlm.se
  --secret TOKEN        CRON_SECRET used by the API endpoint

Optional:
  --log-file PATH       Where to append logs (default: \$HOME/booking-cleanup.log)

Environment variables:
  APP_URL, CRON_SECRET, LOG_FILE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-url)
      APP_URL="$2"; shift 2 ;;
    --secret)
      CRON_SECRET="$2"; shift 2 ;;
    --log-file)
      LOG_FILE="$2"; shift 2 ;;
    -h|--help)
      print_usage; exit 0 ;;
    *)
      echo "Unknown arg: $1" >&2; print_usage; exit 1 ;;
  esac
done

if [[ -z "$APP_URL" || -z "$CRON_SECRET" ]]; then
  echo "ERROR: --app-url and --secret are required (or set APP_URL/CRON_SECRET env)." >&2
  print_usage
  exit 1
fi

if [[ "$APP_URL" != https://* ]]; then
  echo "ERROR: APP_URL must be https (required by external services). Got: $APP_URL" >&2
  exit 1
fi

LOG_FILE_DEFAULT="$HOME/booking-cleanup.log"
LOG_FILE="${LOG_FILE:-$LOG_FILE_DEFAULT}"

command -v curl >/dev/null 2>&1 || { echo "ERROR: curl is required" >&2; exit 1; }
command -v crontab >/dev/null 2>&1 || { echo "ERROR: crontab is not available on this system" >&2; exit 1; }

CRON_COMMENT="# booking-cleanup: clears temp/pending bookings older than 15 minutes"
CRON_CMD="curl -sS -X POST '$APP_URL/api/booking/cleanup-expired' -H 'Authorization: Bearer $CRON_SECRET' -m 25 -f -o /dev/null"
CRON_LINE="*/15 * * * * $CRON_CMD >> '$LOG_FILE' 2>&1"

echo "Testing endpoint reachability..."
set +e
TEST_STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X GET "$APP_URL/api/booking/cleanup-expired" -H "Authorization: Bearer $CRON_SECRET")
set -e
if [[ "$TEST_STATUS" != "200" && "$TEST_STATUS" != "401" && "$TEST_STATUS" != "405" ]]; then
  echo "WARNING: Endpoint returned HTTP $TEST_STATUS during test (this may be fine). Proceeding with install..."
else
  echo "Endpoint responded (HTTP $TEST_STATUS)."
fi

echo "Installing cron entry for user: $(whoami)"
EXISTING=$(crontab -l 2>/dev/null || true)

# Remove previous booking-cleanup entries
FILTERED=$(printf "%s\n" "$EXISTING" | grep -v -F "$CRON_COMMENT" | grep -v -F "/api/booking/cleanup-expired" || true)

{
  printf "%s\n" "$FILTERED"
  echo "$CRON_COMMENT"
  echo "$CRON_LINE"
} | crontab -

echo "Cron installed. Verifying..."
crontab -l | sed -n "/$CRON_COMMENT/,+1p"

echo "Creating log file if missing: $LOG_FILE"
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE" || echo "WARNING: Could not create log file at $LOG_FILE (cron will still run)."

echo "Triggering first run now..."
set +e
RUN_STATUS=$(eval "$CRON_CMD"; echo $?)
set -e
if [[ "$RUN_STATUS" != "0" ]]; then
  echo "WARNING: Initial run returned non-zero exit code ($RUN_STATUS). Check $LOG_FILE for details."
else
  echo "Initial run completed."
fi

echo "Done. Cleanup will run every 15 minutes."


