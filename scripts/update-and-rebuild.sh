#!/bin/bash

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
        print_warning "You're not on main/master branch. Current branch: $current_branch"
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Aborting..."
            exit 1
        fi
    fi
}

# Function to check for uncommitted changes
check_uncommitted_changes() {
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes:"
        git status --short
        
        read -p "Do you want to stash them before pulling? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Stashing changes..."
            git stash push -m "Auto-stash before update $(date)"
            STASHED=true
        else
            print_error "Please commit or stash your changes before updating."
            exit 1
        fi
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
    
    print_status "Pulling changes..."
    if ! git pull origin $(git branch --show-current); then
        print_error "Failed to pull changes"
        exit 1
    fi
    
    print_success "Git pull completed successfully"
}

# Function to check for new dependencies
check_new_dependencies() {
    print_header "Checking for new dependencies"
    
    # Check if package.json or package-lock.json changed
    if git diff --name-only HEAD~1 HEAD | grep -E "(package\.json|package-lock\.json)" > /dev/null; then
        print_status "Dependencies have changed, installing new packages..."
        
        # Remove node_modules and package-lock.json for clean install
        if [ -d "node_modules" ]; then
            print_status "Removing existing node_modules..."
            rm -rf node_modules
        fi
        
        if [ -f "package-lock.json" ]; then
            print_status "Removing existing package-lock.json..."
            rm package-lock.json
        fi
        
        # Install dependencies
        print_status "Installing dependencies..."
        if ! npm install; then
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
    if git diff --name-only HEAD~1 HEAD | grep -E "\.(tsx?|jsx?|json|mjs|css|scss|md|yml|yaml|config\.js|next\.config\.mjs)" > /dev/null; then
        print_status "Source files have changed, rebuild will be needed"
        REBUILD_NEEDED=true
    else
        print_status "No source file changes detected"
    fi
}

# Function to rebuild the application
rebuild_application() {
    if [ "$REBUILD_NEEDED" = true ]; then
        print_header "Rebuilding application"
        
        # Clear Next.js cache
        print_status "Clearing Next.js cache..."
        if [ -d ".next" ]; then
            rm -rf .next
        fi
        
        # Build the application
        print_status "Building application..."
        if ! npm run build; then
            print_error "Build failed"
            exit 1
        fi
        
        print_success "Application rebuilt successfully"
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
    
    # Check if there are any PM2 processes for this app
    local app_name=$(basename $(pwd))
    if pm2 list | grep -q "$app_name"; then
        print_status "Restarting PM2 processes..."
        pm2 restart all
        print_success "PM2 processes restarted"
    else
        print_status "No PM2 processes found for this application"
    fi
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
