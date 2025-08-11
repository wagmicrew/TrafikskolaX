#!/usr/bin/env bash
set -euo pipefail

# Generic Server Administration CLI & Menu
# Handles: Prod/Dev deploy (Git/Build/PM2), Nginx, Git, Node/PM2, Redis, Cron, Neon DB connectivity

############################
# Configuration (override via environment or .env)
############################
APP_DIR="${APP_DIR:-/var/www/app}"
PM2_APP_NAME="${PM2_APP_NAME:-app-prod}"
APP_ENV="${APP_ENV:-prod}"
APP_DIR_DEV="${APP_DIR_DEV:-/var/www/app-dev}"
PM2_APP_NAME_DEV="${PM2_APP_NAME_DEV:-app-dev}"

# Optional Neon/Postgres connection string
DATABASE_URL="${DATABASE_URL:-${NEON_DATABASE_URL:-}}"

############################
# Styling
############################
RESET="\033[0m"; BOLD="\033[1m"; DIM="\033[2m"
RED="\033[31m"; GREEN="\033[32m"; YELLOW="\033[33m"; BLUE="\033[34m"; CYAN="\033[36m"; GRAY="\033[90m"

say() { echo -e "${1}"; }
info() { say "${BLUE}${1}${RESET}"; }
ok() { say "${GREEN}${1}${RESET}"; }
warn() { say "${YELLOW}${1}${RESET}"; }
err() { say "${RED}${1}${RESET}"; }

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Missing command: $1"
    return 1
  fi
}

sudo_or_run() {
  if [ "${EUID:-$(id -u)}" -ne 0 ]; then sudo "$@"; else "$@"; fi
}

load_env_file() {
  if [ -f "$APP_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$APP_DIR/.env" || true
    set +a
    # Prefer env file DATABASE_URL if not already provided
    if [ -z "${DATABASE_URL:-}" ] && grep -qE '^DATABASE_URL=' "$APP_DIR/.env"; then
      # shellcheck disable=SC2002
      DATABASE_URL=$(cat "$APP_DIR/.env" | grep -E '^DATABASE_URL=' | tail -n1 | cut -d'=' -f2-)
    fi
  fi
}

############################
# Core helpers
############################
ensure_in_app_dir() {
  if [ ! -d "$APP_DIR" ]; then
    err "APP_DIR '$APP_DIR' does not exist. Set APP_DIR env or create the directory."
    exit 1
  fi
}

git_pull_fast_forward() {
  ensure_in_app_dir
  need_command git || return 1
  (cd "$APP_DIR" && \
    info "Fetching latest changes..." && git fetch --all --prune && \
    BRANCH=$(git rev-parse --abbrev-ref HEAD) && \
    info "On branch: ${BOLD}${BRANCH}${RESET}" && \
    info "Pulling with --ff-only..." && git pull --ff-only)
}

npm_install_build() {
  ensure_in_app_dir
  need_command npm || return 1
  (cd "$APP_DIR" && \
    if [ -f package-lock.json ]; then
      info "Installing dependencies (npm ci)..." && npm ci
    else
      info "Installing dependencies (npm install)..." && npm install
    fi && \
    if npm run | grep -qE '^  build'; then
      info "Building project (npm run build)..." && npm run build
    else
      warn "No 'build' script found; skipping build."
    fi)
}

pm2_reload_or_start() {
  need_command pm2 || return 1
  if pm2 list | grep -q "\b$PM2_APP_NAME\b"; then
    info "Reloading PM2 app '$PM2_APP_NAME'..." && pm2 reload "$PM2_APP_NAME"
  else
    info "Starting PM2 app '$PM2_APP_NAME' with 'npm start'..." && pm2 start npm --name "$PM2_APP_NAME" -- start
  fi
  pm2 save >/dev/null 2>&1 || true
}

deploy() {
  load_env_file
  ok "Deploying ($APP_ENV) in $APP_DIR with PM2 app '$PM2_APP_NAME'"
  git_pull_fast_forward
  npm_install_build
  pm2_reload_or_start
  ok "Deployment complete. PM2 status:"
  pm2 status || true
}

deploy_prod() {
  APP_ENV=prod APP_DIR="${APP_DIR}" PM2_APP_NAME="${PM2_APP_NAME}" deploy
}

deploy_dev() {
  APP_ENV=dev APP_DIR="${APP_DIR_DEV:-$APP_DIR}" PM2_APP_NAME="${PM2_APP_NAME_DEV}" deploy
}

pm2_status() { need_command pm2 || return 1; pm2 status; }
pm2_logs() { need_command pm2 || return 1; pm2 logs "$PM2_APP_NAME" --lines 50; }

nginx_test() { sudo_or_run nginx -t; }
nginx_reload() { sudo_or_run systemctl reload nginx && ok "Nginx reloaded."; }
nginx_status() { sudo_or_run systemctl status nginx --no-pager || true; }
nginx_logs() { sudo_or_run journalctl -u nginx -n 100 --no-pager || true; }

git_status() { ensure_in_app_dir; (cd "$APP_DIR" && git status -sb); }
git_pull() { git_pull_fast_forward; }
git_branches() { ensure_in_app_dir; (cd "$APP_DIR" && git fetch --all --prune && git branch -a); }

node_info() {
  if command -v node >/dev/null 2>&1; then node -v; else warn "node not found"; fi
  if command -v npm >/dev/null 2>&1; then npm -v; else warn "npm not found"; fi
  if command -v pm2 >/dev/null 2>&1; then pm2 -v; else warn "pm2 not found"; fi
}

redis_status() { sudo_or_run systemctl status redis-server --no-pager || true; }
redis_logs() { sudo_or_run journalctl -u redis-server -n 100 --no-pager || true; }
redis_restart() { sudo_or_run systemctl restart redis-server && ok "Redis restarted."; }
redis_ping() { if command -v redis-cli >/dev/null 2>&1; then redis-cli ping || true; else warn "redis-cli not installed"; fi }

cron_list() { crontab -l || true; }
cron_edit() { ${EDITOR:-nano} <(crontab -l 2>/dev/null) || true; }

db_test() {
  load_env_file
  local url="${DATABASE_URL:-}"
  if [ -z "$url" ]; then
    err "DATABASE_URL not set. Export DATABASE_URL or set it in $APP_DIR/.env"
    return 1
  fi
  if ! command -v psql >/dev/null 2>&1; then
    err "psql not found. Install postgres client: sudo apt-get install -y postgresql-client"
    return 1
  fi
  info "Testing connection to database..."
  PGPASSWORD="" psql "$url" -c 'select now() as server_time;' -q || true
}

show_help() {
  cat <<EOF
${BOLD}Server Admin Quick Commands${RESET}

  server-admin deploy                 # Git fetch+pull, install, build, PM2 reload/start
  server-admin deploy:prod            # Deploy using prod env (APP_DIR, PM2_APP_NAME)
  server-admin deploy:dev             # Deploy using dev env (APP_DIR_DEV, PM2_APP_NAME_DEV)
  server-admin pm2 status|logs        # PM2 status/logs for $PM2_APP_NAME
  server-admin nginx test|reload|status|logs
  server-admin git status|pull|branches
  server-admin node info              # Show node/npm/pm2 versions
  server-admin redis status|logs|restart|ping
  server-admin cron list              # Show user crontab
  server-admin db test                # Test Neon/Postgres connectivity using DATABASE_URL
  server-admin menu                   # Interactive menu

Environment:
  APP_DIR=$APP_DIR
  APP_DIR_DEV=$APP_DIR_DEV
  PM2_APP_NAME=$PM2_APP_NAME
  PM2_APP_NAME_DEV=$PM2_APP_NAME_DEV
  APP_ENV=$APP_ENV
  DATABASE_URL=${DATABASE_URL:-}
EOF
}

interactive_menu() {
  clear
  say "${BOLD}Server Administration Menu${RESET}"
  say "${GRAY}APP_DIR=$APP_DIR | PM2_APP_NAME=$PM2_APP_NAME | APP_ENV=$APP_ENV${RESET}"
  say ""
  say "1) Deploy (fetch, build, PM2 reload)"
  say "1a) Deploy PROD"
  say "1b) Deploy DEV"
  say "2) PM2 status"
  say "3) PM2 logs ($PM2_APP_NAME)"
  say "4) Nginx: test config"
  say "5) Nginx: reload"
  say "6) Nginx: status"
  say "7) Nginx: logs"
  say "8) Git: status"
  say "9) Git: pull"
  say "10) Git: branches"
  say "11) Node info (node/npm/pm2 versions)"
  say "12) Redis: status"
  say "13) Redis: logs"
  say "14) Redis: restart"
  say "15) Redis: ping"
  say "16) Cron: list"
  say "17) DB: test connection"
  say "0) Exit"
  say ""
  read -rp "Select an option: " choice
  case "$choice" in
    1) deploy ;;
    1a) deploy_prod ;;
    1b) deploy_dev ;;
    2) pm2_status ;;
    3) pm2_logs ;;
    4) nginx_test ;;
    5) nginx_reload ;;
    6) nginx_status ;;
    7) nginx_logs ;;
    8) git_status ;;
    9) git_pull ;;
    10) git_branches ;;
    11) node_info ;;
    12) redis_status ;;
    13) redis_logs ;;
    14) redis_restart ;;
    15) redis_ping ;;
    16) cron_list ;;
    17) db_test ;;
    0) exit 0 ;;
    *) warn "Invalid option" ;;
  esac
  say ""
  read -rp "Press Enter to continue..." _
}

main() {
  cmd="${1:-menu}"
  sub="${2:-}"
  case "$cmd" in
    deploy) deploy ;;
    deploy:prod) deploy_prod ;;
    deploy:dev) deploy_dev ;;
    pm2)
      case "$sub" in
        logs) pm2_logs ;;
        status|*) pm2_status ;;
      esac
      ;;
    nginx)
      case "$sub" in
        test) nginx_test ;;
        reload) nginx_reload ;;
        status) nginx_status ;;
        logs|*) nginx_logs ;;
      esac
      ;;
    git)
      case "$sub" in
        status) git_status ;;
        pull) git_pull ;;
        branches|*) git_branches ;;
      esac
      ;;
    node)
      node_info ;;
    redis)
      case "$sub" in
        status) redis_status ;;
        logs) redis_logs ;;
        restart) redis_restart ;;
        ping|*) redis_ping ;;
      esac
      ;;
    cron)
      cron_list ;;
    db)
      db_test ;;
    help|-h|--help)
      show_help ;;
    menu|*)
      while true; do interactive_menu; done ;;
  esac
}

main "$@"


