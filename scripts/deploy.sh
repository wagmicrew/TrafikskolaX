#!/bin/bash

# TrafikskolaX Server Deployment Script
# This script performs a complete server deployment including cache clearing, git pull, build, and PM2 restart
# Designed for Ubuntu/Linux server environments only

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if we're in the correct directory
check_project_directory() {
    print_status "Checking project directory structure..."
    
    # List current directory contents for debugging
    print_status "Current directory contents:"
    ls -la | head -10
    
    # Check for various project indicators
    local has_package_json=false
    local has_next_config=false
    local has_app_dir=false
    local has_components_dir=false
    
    if [ -f "package.json" ]; then
        has_package_json=true
        print_success "Found package.json"
    else
        print_warning "package.json not found"
    fi
    
    if [ -f "next.config.js" ]; then
        has_next_config=true
        print_success "Found next.config.js"
    else
        print_warning "next.config.js not found"
    fi
    
    if [ -d "app" ]; then
        has_app_dir=true
        print_success "Found app directory"
    else
        print_warning "app directory not found"
    fi
    
    if [ -d "components" ]; then
        has_components_dir=true
        print_success "Found components directory"
    else
        print_warning "components directory not found"
    fi
    
    # More flexible check - if we have at least 2 indicators, we're probably in the right place
    local indicators=0
    [ "$has_package_json" = true ] && ((indicators++))
    [ "$has_next_config" = true ] && ((indicators++))
    [ "$has_app_dir" = true ] && ((indicators++))
    [ "$has_components_dir" = true ] && ((indicators++))
    
    if [ $indicators -ge 2 ]; then
        print_success "Project directory validation passed (${indicators}/4 indicators found)"
        return 0
    else
        print_error "This doesn't appear to be the TrafikskolaX project directory."
        print_error "Expected to find at least 2 of: package.json, next.config.js, app/, components/"
        print_error "Found: ${indicators}/4 indicators"
        print_error "Current directory: $(pwd)"
        print_error "Please run this script from the project root directory."
        return 1
    fi
}

# Function to clear Redis cache
clear_redis_cache() {
    print_status "Clearing Redis cache..."
    
    if command_exists redis-cli; then
        if redis-cli ping >/dev/null 2>&1; then
            redis-cli FLUSHALL
            print_success "Redis cache cleared successfully"
        else
            print_warning "Redis server is not running or not accessible"
        fi
    else
        print_warning "redis-cli not found. Skipping Redis cache clearing."
    fi
}

# Function to clear Node.js and Next.js caches
clear_node_cache() {
    print_status "Clearing Node.js and Next.js caches..."
    
    # Clear Next.js build cache
    if [ -d ".next" ]; then
        rm -rf .next
        print_success "Next.js build cache cleared"
    fi
    
    # Clear Turbo cache if exists
    if [ -d ".turbo" ]; then
        rm -rf .turbo
        print_success "Turbo cache cleared"
    fi
    
    # Clear node_modules cache
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        print_success "Node.js cache cleared"
    fi
}

# Function to clear npm cache
clear_npm_cache() {
    print_status "Clearing npm cache..."
    npm cache clean --force
    print_success "npm cache cleared"
}

# Function to check git status and pull
git_operations() {
    print_status "Checking git status..."
    
    if [ ! -d ".git" ]; then
        print_error "This is not a git repository"
        exit 1
    fi
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "There are uncommitted changes in the repository:"
        git status --short
        read -p "Do you want to stash these changes? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git stash push -m "Auto-stash before deployment $(date)"
            print_success "Changes stashed"
        else
            print_error "Please commit or stash your changes before deploying"
            exit 1
        fi
    fi
    
    print_status "Pulling latest changes from git..."
    git pull origin main || git pull origin master
    print_success "Git pull completed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Remove node_modules for clean install
    if [ -d "node_modules" ]; then
        print_status "Removing existing node_modules..."
        rm -rf node_modules
    fi
    
    # Check if package-lock.json exists
    if [ -f "package-lock.json" ]; then
        print_status "Using npm ci for clean install with package-lock.json..."
        npm ci --production=false
    else
        print_status "package-lock.json not found, using npm install..."
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to build the project for production
build_project() {
    print_status "Building the project for production..."
    
    # Set NODE_ENV to production for build
    export NODE_ENV=production
    
    # Run the build
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Project built successfully for production"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Function to restart PM2
restart_pm2() {
    print_status "Restarting PM2 processes..."
    
    if command_exists pm2; then
        # Get the current PM2 processes
        PM2_PROCESSES=$(pm2 list --format json | jq -r '.[].name' 2>/dev/null || echo "")
        
        if [ -n "$PM2_PROCESSES" ]; then
            print_status "Found PM2 processes: $PM2_PROCESSES"
            pm2 restart all
            print_success "All PM2 processes restarted"
        else
            print_warning "No PM2 processes found. Starting the application..."
            pm2 start npm --name "trafikskolax" -- start
            print_success "PM2 process started"
        fi
        
        # Save PM2 configuration
        pm2 save
        print_success "PM2 configuration saved"
        
        # Show PM2 status
        print_status "PM2 Status:"
        pm2 list
    else
        print_error "PM2 not found. Please install PM2 first: npm install -g pm2"
        exit 1
    fi
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if we're on Ubuntu/Linux
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_warning "This script is designed for Ubuntu/Linux servers"
    fi
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
    
    # Check git
    if ! command_exists git; then
        print_error "git is not installed"
        exit 1
    fi
    
    GIT_VERSION=$(git --version)
    print_success "Git version: $GIT_VERSION"
    
    # Check PM2
    if ! command_exists pm2; then
        print_warning "PM2 is not installed. Installing PM2..."
        npm install -g pm2
        print_success "PM2 installed"
    fi
    
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 version: $PM2_VERSION"
    
    # Check jq for JSON parsing
    if ! command_exists jq; then
        print_warning "jq not found. Installing jq..."
        sudo apt-get update && sudo apt-get install -y jq
        print_success "jq installed"
    fi
}

# Function to remove localhost references from codebase
remove_localhost_references() {
    print_status "Checking for localhost references in codebase..."
    
    # Find all localhost references
    LOCALHOST_FILES=$(grep -r "localhost" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude=*.log --exclude=*.lock 2>/dev/null || true)
    
    if [ -n "$LOCALHOST_FILES" ]; then
        print_warning "Found localhost references in the following files:"
        echo "$LOCALHOST_FILES"
        echo
        read -p "Do you want to replace localhost references with production domain? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Replace localhost:3000 with production domain
            find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.env*" \) \
                -not -path "./node_modules/*" \
                -not -path "./.git/*" \
                -not -path "./.next/*" \
                -exec sed -i 's/localhost:3000/dintrafikskolahlm.se/g' {} \;
            
            # Replace localhost (without port) with production domain
            find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.env*" \) \
                -not -path "./node_modules/*" \
                -not -path "./.git/*" \
                -not -path "./.next/*" \
                -exec sed -i 's/localhost/dintrafikskolahlm.se/g' {} \;
            
            print_success "Localhost references replaced with production domain"
        fi
    else
        print_success "No localhost references found in codebase"
    fi
}

# Main deployment function
main() {
    echo "=========================================="
    echo "    TrafikskolaX Server Deployment"
    echo "=========================================="
    echo
    
    # Check if we're in the right directory
    check_project_directory
    
    # Check system requirements
    check_requirements
    
    echo
    print_status "Starting server deployment process..."
    echo
    
    # Step 1: Remove localhost references
    remove_localhost_references
    echo
    
    # Step 2: Clear caches
    clear_redis_cache
    clear_node_cache
    clear_npm_cache
    echo
    
    # Step 3: Git operations
    git_operations
    echo
    
    # Step 4: Install dependencies
    install_dependencies
    echo
    
    # Step 5: Build project
    build_project
    echo
    
    # Step 6: Restart PM2
    restart_pm2
    echo
    
    print_success "Server deployment completed successfully!"
    echo
    print_status "Deployment Summary:"
    echo "  ✓ Localhost references checked/removed"
    echo "  ✓ Redis cache cleared"
    echo "  ✓ Node.js and Next.js caches cleared"
    echo "  ✓ Git repository updated"
    echo "  ✓ Dependencies installed"
    echo "  ✓ Project built for production"
    echo "  ✓ PM2 processes restarted"
    echo
    
    # Show final PM2 status
    print_status "Final PM2 Status:"
    pm2 list
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --dry-run      Show what would be done without executing"
        echo "  --skip-cache   Skip cache clearing"
        echo "  --skip-git     Skip git operations"
        echo "  --skip-build   Skip building the project"
        echo "  --skip-pm2     Skip PM2 restart"
        echo "  --skip-localhost Skip localhost reference removal"
        echo "  --skip-check   Skip project directory validation"
        echo
        echo "Examples:"
        echo "  $0              # Full deployment"
        echo "  $0 --dry-run    # Show what would be done"
        echo "  $0 --skip-cache # Deploy without clearing caches"
        echo "  $0 --skip-check # Skip directory validation"
        exit 0
        ;;
    --dry-run)
        print_status "DRY RUN MODE - No changes will be made"
        echo "This would perform the following operations:"
        echo "  1. Check/remove localhost references"
        echo "  2. Clear Redis cache"
        echo "  3. Clear Node.js and Next.js caches"
        echo "  4. Clear npm cache"
        echo "  5. Pull latest changes from git"
        echo "  6. Install dependencies"
        echo "  7. Build the project for production"
        echo "  8. Restart PM2 processes"
        exit 0
        ;;
    --skip-cache)
        print_warning "Skipping cache clearing"
        clear_redis_cache() { print_status "Skipping Redis cache clearing..."; }
        clear_node_cache() { print_status "Skipping Node.js cache clearing..."; }
        clear_npm_cache() { print_status "Skipping npm cache clearing..."; }
        ;;
    --skip-git)
        print_warning "Skipping git operations"
        git_operations() { print_status "Skipping git operations..."; }
        ;;
    --skip-build)
        print_warning "Skipping build process"
        build_project() { print_status "Skipping build process..."; }
        ;;
    --skip-pm2)
        print_warning "Skipping PM2 restart"
        restart_pm2() { print_status "Skipping PM2 restart..."; }
        ;;
    --skip-localhost)
        print_warning "Skipping localhost reference removal"
        remove_localhost_references() { print_status "Skipping localhost reference removal..."; }
        ;;
    --skip-check)
        print_warning "Skipping project directory validation"
        check_project_directory() { print_status "Skipping directory validation..."; return 0; }
        ;;
    "")
        # No arguments, proceed with full deployment
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

# Run the main deployment function
main "$@"
