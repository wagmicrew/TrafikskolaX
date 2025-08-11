#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
}

# Function to check current branch
check_current_branch() {
    local current_branch=$(git branch --show-current)
    print_status "Current branch: $current_branch"
    
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        print_warning "Not on main/master (current: $current_branch). Continuing with caution."
    fi
}

# Function to check for uncommitted changes
check_uncommitted_changes() {
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Uncommitted changes detected. Auto-stashing before update..."
        git stash push -u -m "Auto-stash before update $(date)" >/dev/null 2>&1 || true
        STASHED=true
    fi
}

# Function to perform git pull
perform_git_pull() {
    print_header "Pulling latest changes from remote"
    
    print_status "Fetching latest changes..."
    if ! git fetch origin; then
        print_error "Failed to fetch from remote"
        exit 1
    fi
    
    PRE_HASH=$(git rev-parse HEAD)
    BRANCH=$(git branch --show-current)
    print_status "Pulling changes with --ff-only..."
    if ! git pull --ff-only origin "$BRANCH"; then
        print_error "Fast-forward pull failed (diverged history). Please resolve locally."
        exit 1
    fi
    POST_HASH=$(git rev-parse HEAD)
    
    print_success "Git pull completed successfully"
}

# Function to check for new dependencies
check_new_dependencies() {
    print_header "Checking for new dependencies"
    
    # Compare pre/post pull (fallback if PRE_HASH undefined)
    local base_range
    if [ -n "${PRE_HASH:-}" ] && [ -n "${POST_HASH:-}" ]; then
      base_range="$PRE_HASH..$POST_HASH"
    else
      base_range="HEAD~1..HEAD"
    fi
    if git diff --name-only "$base_range" | grep -E "(package\.json|package-lock\.json)" >/dev/null; then
        print_status "Dependencies have changed, installing new packages..."

        export CI=${CI:-1}
        export NPM_CONFIG_FUND=false
        export NPM_CONFIG_AUDIT=false

        # Install dependencies (prefer deterministic CI install if lockfile exists)
        if [ -f package-lock.json ]; then
            print_status "Running npm ci (no-audit, no-fund, prefer-offline)..."
            if ! npm ci --no-audit --no-fund --prefer-offline; then
                print_warning "npm ci failed, retrying without prefer-offline..."
                if ! npm ci --no-audit --no-fund; then
                    print_warning "npm ci failed again, trying with legacy peer deps..."
                    if ! npm ci --no-audit --no-fund --legacy-peer-deps; then
                        print_warning "npm ci still failing, cleaning cache and trying npm install --legacy-peer-deps..."
                        npm cache clean --force || true
                        if ! npm install --no-audit --no-fund --legacy-peer-deps; then
                            print_error "Failed to install dependencies"
                            exit 1
                        fi
                    fi
                fi
            fi
        else
            print_status "Running npm install (no lockfile, no-audit, no-fund, legacy-peer-deps)..."
            if ! npm install --no-audit --no-fund --legacy-peer-deps; then
                print_error "Failed to install dependencies"
                exit 1
            fi
        fi

        print_success "Dependencies installed successfully"
        REBUILD_NEEDED=true
    else
        print_status "No dependency changes detected"
    fi
}

check_node_npm() {
    print_header "Checking Node.js and npm versions"
    export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
    node -v || { print_error "Node.js not found in PATH"; exit 1; }
    npm -v || { print_error "npm not found in PATH"; exit 1; }
}

run_build() {
    print_header "Building application"
    export NODE_ENV=production
    export NEXT_DISABLE_SOURCEMAPS=${NEXT_DISABLE_SOURCEMAPS:-1}
    export NODE_OPTIONS="--max-old-space-size=${NODE_MAX_OLD_SPACE_SIZE:-4096} ${NODE_OPTIONS:-}"
    
    # Clear Next.js cache for clean builds when code changed
    print_status "Clearing Next.js cache..."
    [ -d .next ] && rm -rf .next || true
    
    if [ -f scripts/build-with-progress.mjs ]; then
        print_status "Using scripts/build-with-progress.mjs"
        node scripts/build-with-progress.mjs || { print_error "Build failed"; exit 1; }
    else
        print_status "Using next build"
        npx --yes next build || { print_error "Build failed"; exit 1; }
    fi
    print_success "Build completed"
}
            print_error "Failed to install dependencies"
            exit 1
        fi
        
        print_success "Dependencies installed successfully"
        REBUILD_NEEDED=true
    else
        print_status "No dependency changes detected"
    fi
}

# Function to check for build-related changes
check_build_changes() {
    print_header "Checking for build-related changes"
    
    # Check if any source files, config files, or build-related files changed
    if git diff --name-only "$PRE_HASH".."$POST_HASH" | grep -E "\.(tsx?|jsx?|json|mjs|css|scss|md|yml|yaml|config\.js|next\.config\.mjs)$" >/dev/null; then
        print_status "Source files have changed, rebuild will be needed"
        REBUILD_NEEDED=true
    else
        print_status "No source file changes detected"
    fi
}

# Function to rebuild the application
rebuild_application() {
    if [ "$REBUILD_NEEDED" = true ]; then
        run_build
    else
        print_status "No rebuild needed"
    fi
}

# Function to restart PM2 processes (if running)
restart_pm2_processes() {
    print_header "Restarting PM2 processes"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 not found, skipping PM2 restart"
        return
    fi
    
    local target=${PM2_APP_NAME:-}
    if [ -n "$target" ]; then
        print_status "Reloading PM2 app '$target'..."
        pm2 reload "$target" || pm2 restart "$target" || print_warning "PM2 reload failed for '$target'"
    else
        print_status "PM2_APP_NAME not set; reloading all PM2 apps"
        pm2 reload all || pm2 restart all || true
    fi
    pm2 save >/dev/null 2>&1 || true
    print_success "PM2 reload attempted"
}

# Function to restart development server (if running)
restart_dev_server() {
    print_header "Development server status"
    
    # Check if there's a development server running
    if pgrep -f "npm run dev" > /dev/null; then
        print_status "Development server is running"
        read -p "Do you want to restart the development server? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Restarting development server..."
            pkill -f "npm run dev"
            sleep 2
            npm run dev &
            print_success "Development server restarted"
        fi
    else
        print_status "No development server running"
    fi
}

# Function to restore stashed changes
restore_stashed_changes() {
    if [ "$STASHED" = true ]; then
        print_header "Restoring stashed changes"
        
        if git stash list | grep -q "Auto-stash before update"; then
            print_status "Restoring stashed changes..."
            if git stash pop; then
                print_success "Stashed changes restored"
            else
                print_warning "Failed to restore stashed changes. You can restore them manually with 'git stash pop'"
            fi
        fi
    fi
}

# Function to show summary
show_summary() {
    print_header "Update Summary"
    
    echo -e "${CYAN}Changes pulled:${NC} $(git log --oneline HEAD~1..HEAD | wc -l) commits"
    echo -e "${CYAN}Dependencies updated:${NC} $([ "$REBUILD_NEEDED" = true ] && echo "Yes" || echo "No")"
    echo -e "${CYAN}Application rebuilt:${NC} $([ "$REBUILD_NEEDED" = true ] && echo "Yes" || echo "No")"
    echo -e "${CYAN}PM2 restarted:${NC} $([ "$PM2_RESTARTED" = true ] && echo "Yes" || echo "No")"
    
    print_success "Update completed successfully!"
}

# Main execution
main() {
    print_header "TrafikskolaX Update Script"
    
    # Initialize variables
    STASHED=false
    REBUILD_NEEDED=false
    PM2_RESTARTED=false
    
    # Check prerequisites
    check_git_repo
    check_current_branch
    check_uncommitted_changes
    
    # Perform update
    perform_git_pull
    check_node_npm
    check_new_dependencies
    check_build_changes
    rebuild_application
    
    # Restart services
    restart_pm2_processes
    PM2_RESTARTED=true
    restart_dev_server
    
    # Restore changes if needed
    restore_stashed_changes
    
    # Show summary
    show_summary
}

# Run main function
main "$@"
