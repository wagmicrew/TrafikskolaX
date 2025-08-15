#!/usr/bin/env bash
# Qliro integration validation runner (Ubuntu/Linux)
# - Runs scripts/test-qliro-validate.ts using tsx (fallback to ts-node)
# - Logs output to logs/ with timestamped filename
#
# Usage:
#   chmod +x scripts/qliro-validate.sh
#   ./scripts/qliro-validate.sh
#
# Optional:
#   DEBUG=1 ./scripts/qliro-validate.sh   # prints extra runner info

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "${LOG_DIR}"
STAMP="$(date +%F_%H-%M-%S)"
LOG_FILE="${LOG_DIR}/qliro-validate-${STAMP}.log"

printf "\n=== Qliro Validation (Ubuntu) ===\n" | tee -a "$LOG_FILE"
echo "Project root: $PROJECT_ROOT" | tee -a "$LOG_FILE"
echo "Timestamp: $(date -Is)" | tee -a "$LOG_FILE"

# Show environment basics
if command -v node >/dev/null 2>&1; then
  echo "Node: $(node -v)" | tee -a "$LOG_FILE"
else
  echo "Node is not installed or not in PATH" | tee -a "$LOG_FILE"
fi
if command -v npm >/dev/null 2>&1; then
  echo "npm: $(npm -v)" | tee -a "$LOG_FILE"
fi
if command -v npx >/dev/null 2>&1; then
  echo "npx: $(npx -v)" | tee -a "$LOG_FILE"
fi

# Choose runner: prefer tsx, fallback to ts-node
RUNNER=""
if npx -y tsx --version >/dev/null 2>&1; then
  RUNNER="npx -y tsx"
elif npx -y ts-node --version >/dev/null 2>&1; then
  RUNNER="npx -y ts-node --esm"
else
  echo "Neither tsx nor ts-node available via npx. Install one of them and retry." | tee -a "$LOG_FILE"
  exit 1
fi

[ "${DEBUG:-0}" != "0" ] && echo "Using runner: $RUNNER" | tee -a "$LOG_FILE"

# Run the validator (force reload is handled inside the TS script)
set +e
$RUNNER scripts/test-qliro-validate.ts 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}
set -e

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "\nResult: SUCCESS" | tee -a "$LOG_FILE"
else
  echo "\nResult: FAILURE (exit $EXIT_CODE)" | tee -a "$LOG_FILE"
fi

echo "Log saved to: $LOG_FILE"
exit "$EXIT_CODE"
