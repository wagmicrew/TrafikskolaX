#!/usr/bin/env bash
set -euo pipefail

# TrafikskolaX Deployment Script (enhanced)
# Supports dev/prod targets with separate remote directories

# Defaults (can be overridden by env vars or CLI flags)
REMOTE_USER=${REMOTE_USER:-"trafikskolax"}
REMOTE_HOST=${REMOTE_HOST:-"dev.dintrafikskolahlm.se"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}          # dev | prod
REMOTE_BASE=${REMOTE_BASE:-"/var/www"}
LOCAL_PATH=${LOCAL_PATH:-"."}
SSH_KEY=${SSH_KEY:-"~/.ssh/trafikskolax_key"}

# Derived
if [[ "$ENVIRONMENT" == "prod" ]]; then
  REMOTE_PATH="$REMOTE_BASE/dintrafikskolax_prod"
  PM2_APP_NAME="trafikskolax_prod"
else
  REMOTE_PATH="$REMOTE_BASE/dintrafikskolax_dev"
  PM2_APP_NAME="trafikskolax_dev"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting TrafikskolaX deployment (${ENVIRONMENT})...${NC}"

usage() {
  echo "Usage: $0 {deploy|setup|push|full} [--env dev|prod] [--host HOST] [--user USER] [--key SSH_KEY]" >&2
}

# Parse flags following the command
parse_flags() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env)
        ENVIRONMENT="$2"; shift 2 ;;
      --host)
        REMOTE_HOST="$2"; shift 2 ;;
      --user)
        REMOTE_USER="$2"; shift 2 ;;
      --key)
        SSH_KEY="$2"; shift 2 ;;
      *)
        echo "Unknown option: $1" >&2; usage; exit 1 ;;
    esac
  done
  # Recompute derived after flags
  if [[ "$ENVIRONMENT" == "prod" ]]; then
    REMOTE_PATH="$REMOTE_BASE/dintrafikskolax_prod"
    PM2_APP_NAME="trafikskolax_prod"
  else
    REMOTE_PATH="$REMOTE_BASE/dintrafikskolax_dev"
    PM2_APP_NAME="trafikskolax_dev"
  fi
}

# Function to deploy via SSH
deploy() {
  parse_flags "$@"
  echo -e "${YELLOW}Deploying to ${REMOTE_HOST} (${ENVIRONMENT})...${NC}"

  # Build locally (production)
  echo -e "${YELLOW}Building project (local)...${NC}"
  NODE_ENV=production npm run build

  # Sync files to remote target path
  echo -e "${YELLOW}Syncing files to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH} ...${NC}"
  rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env.local' \
    --exclude 'scripts/deploy-*' \
    -e "ssh -i ${SSH_KEY}" \
    ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

  # Install deps and restart PM2 remotely
  echo -e "${YELLOW}Installing dependencies and restarting PM2 on remote...${NC}"
  ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} bash -s << EOF
set -euo pipefail
cd "${REMOTE_PATH}"
export NPM_CONFIG_FUND=false
export NPM_CONFIG_AUDIT=false
if [ -f package-lock.json ]; then
  npm ci --omit=dev || npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps
else
  npm install --omit=dev --legacy-peer-deps
fi
pm2 describe "${PM2_APP_NAME}" >/dev/null 2>&1 \
  && pm2 reload "${PM2_APP_NAME}" \
  || pm2 start npm --name "${PM2_APP_NAME}" -- start
pm2 save || true
EOF

  echo -e "${GREEN}Deployment completed successfully!${NC}"
}

# Function to setup remote server
setup_remote() {
  parse_flags "$@"
  echo -e "${YELLOW}Setting up remote server (${ENVIRONMENT})...${NC}"

  ssh -i ${SSH_KEY} root@${REMOTE_HOST} bash -s << EOF
set -euo pipefail
# Create user if not exists
if ! id -u ${REMOTE_USER} >/dev/null 2>&1; then
  useradd -m -s /bin/bash ${REMOTE_USER}
  echo "User ${REMOTE_USER} created"
fi

# Create directories
mkdir -p "${REMOTE_BASE}/dintrafikskolax_dev" "${REMOTE_BASE}/dintrafikskolax_prod"
chown -R ${REMOTE_USER}:${REMOTE_USER} "${REMOTE_BASE}/dintrafikskolax_dev" "${REMOTE_BASE}/dintrafikskolax_prod"

echo "Remote setup completed"
EOF
}

# Function to push to GitHub
push_to_github() {
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    git add .
    git commit -m "Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')"
    git push origin master
}

# Main execution
cmd="${1:-}"; shift || true
case "$cmd" in
  deploy)
    deploy "$@" ;;
  setup)
    setup_remote "$@" ;;
  push)
    push_to_github ;;
  full)
    push_to_github; deploy "$@" ;;
  *)
    usage; exit 1 ;;
esac
