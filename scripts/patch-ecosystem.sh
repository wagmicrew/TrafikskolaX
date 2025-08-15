#!/usr/bin/env bash
set -euo pipefail

# Patch ecosystem.config.js to include MAINTENANCE_TOKEN and correct ports.
# Usage:
#   sudo bash scripts/patch-ecosystem.sh --token <SECRET> \
#        --prod-port 3000 --dev-port 3001 \
#        --prod-url https://dintrafikskolahlm.se \
#        --dev-url https://dev.dintrafikskolahlm.se

TOKEN=""
PROD_PORT=3000
DEV_PORT=3001
PROD_URL="https://dintrafikskolahlm.se"
DEV_URL="https://dev.dintrafikskolahlm.se"
FILE="ecosystem.config.js"

while [ $# -gt 0 ]; do
  case "$1" in
    --token) TOKEN="$2"; shift 2;;
    --prod-port) PROD_PORT="$2"; shift 2;;
    --dev-port) DEV_PORT="$2"; shift 2;;
    --prod-url) PROD_URL="$2"; shift 2;;
    --dev-url) DEV_URL="$2"; shift 2;;
    --file) FILE="$2"; shift 2;;
    *) echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

if [ -z "$TOKEN" ]; then
  echo "[-] --token is required" >&2
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "[-] $FILE not found" >&2
  exit 1
fi

cp -a "$FILE" "$FILE.$(date +%F_%H%M%S).bak"

# Normalize line endings just in case
if command -v dos2unix >/dev/null 2>&1; then dos2unix -q "$FILE" || true; fi

# Update DEV block env vars
sed -i -E "
  s/(name:\s*'dintrafikskolax-dev'[\s\S]*?PORT:\s*)([0-9]+)/\1${DEV_PORT}/; \
  s/(name:\s*'dintrafikskolax-dev'[\s\S]*?NEXTAUTH_URL:\s*')[^']*('/\1${DEV_URL}\2/; \
  s/(name:\s*'dintrafikskolax-dev'[\s\S]*?NEXT_PUBLIC_APP_URL:\s*')[^']*('/\1${DEV_URL}\2/
" "$FILE"

# Update PROD block env vars
sed -i -E "
  s/(name:\s*'dintrafikskolax-prod'[\s\S]*?PORT:\s*)([0-9]+)/\1${PROD_PORT}/; \
  s/(name:\s*'dintrafikskolax-prod'[\s\S]*?NEXTAUTH_URL:\s*')[^']*('/\1${PROD_URL}\2/; \
  s/(name:\s*'dintrafikskolax-prod'[\s\S]*?NEXT_PUBLIC_APP_URL:\s*')[^']*('/\1${PROD_URL}\2/
" "$FILE"

# Insert MAINTENANCE_TOKEN into both env blocks if not present
insert_token_js() {
  local block_name="$1"
  if ! awk "/name: '${block_name}'/{f=1} f && /MAINTENANCE_TOKEN/ {print; exit}" "$FILE" >/dev/null; then
    awk -v app="$block_name" -v tok="$TOKEN" '
      BEGIN{f=0}
      $0 ~ "name: \x27"app"\x27" {f=1}
      f && /JWT_SECRET:/ && !done {
        sub(/JWT_SECRET:[^,]*/, "JWT_SECRET: process.env.JWT_SECRET,\n        MAINTENANCE_TOKEN: \x27" tok "\x27");
        done=1
      }
      {print}
    ' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
  fi
}

insert_token_js "dintrafikskolax-dev"
insert_token_js "dintrafikskolax-prod"

echo "[i] Patched $FILE with MAINTENANCE_TOKEN and updated ports/URLs."
echo "[i] Restart PM2 with: pm2 restart dintrafikskolax-prod --update-env && pm2 restart dintrafikskolax-dev --update-env && pm2 save"


