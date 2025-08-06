#!/bin/bash

# 🔧 Dependency Fix Script for Din Trafikskola Hässleholm
# Fixes missing dependencies and ensures proper module installation

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="dintrafikskolax"
DEV_DIR="/var/www/${PROJECT_NAME}_dev"
PROD_DIR="/var/www/${PROJECT_NAME}_prod"

# Log file
LOG_FILE="/var/log/dependency-fix.log"
ERROR_LOG="/var/log/dependency-fix-errors.log"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "$(date): SUCCESS - $1" >> "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "$(date): WARNING - $1" >> "$LOG_FILE"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "$(date): ERROR - $1" >> "$ERROR_LOG"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "$(date): INFO - $1" >> "$LOG_FILE"
}

print_header() {
    echo -e "${CYAN}📋 $1${NC}"
    echo "$(date): HEADER - $1" >> "$LOG_FILE"
}

# Function to check if directory exists
directory_exists() {
    [ -d "$1" ]
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check PM2 status
check_pm2_status() {
    print_header "Checking PM2 Status"
    
    if command -v pm2 >/dev/null 2>&1; then
        print_status "PM2 is installed"
        
        # Check PM2 processes
        local dev_status=$(pm2 list | grep "${PROJECT_NAME}-dev" | awk '{print $10}' 2>/dev/null || echo "not_found")
        local prod_status=$(pm2 list | grep "${PROJECT_NAME}-prod" | awk '{print $10}' 2>/dev/null || echo "not_found")
        
        print_info "Development app status: $dev_status"
        print_info "Production app status: $prod_status"
        
        return 0
    else
        print_error "PM2 is not installed"
        return 1
    fi
}

# Function to check application directories
check_app_directories() {
    print_header "Checking Application Directories"
    
    local all_good=true
    
    if directory_exists "$DEV_DIR"; then
        print_status "Development directory exists: $DEV_DIR"
    else
        print_error "Development directory missing: $DEV_DIR"
        all_good=false
    fi
    
    if directory_exists "$PROD_DIR"; then
        print_status "Production directory exists: $PROD_DIR"
    else
        print_error "Production directory missing: $PROD_DIR"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        return 1
    fi
    
    return 0
}

# Function to check node_modules
check_node_modules() {
    print_header "Checking Node Modules"
    
    local all_good=true
    
    # Check development node_modules
    if directory_exists "$DEV_DIR/node_modules"; then
        print_status "Development node_modules exists"
        
        # Check for critical modules
        if directory_exists "$DEV_DIR/node_modules/bcrypt"; then
            print_status "Development bcrypt module found"
        else
            print_warning "Development bcrypt module missing"
            all_good=false
        fi
    else
        print_error "Development node_modules missing"
        all_good=false
    fi
    
    # Check production node_modules
    if directory_exists "$PROD_DIR/node_modules"; then
        print_status "Production node_modules exists"
        
        # Check for critical modules
        if directory_exists "$PROD_DIR/node_modules/bcrypt"; then
            print_status "Production bcrypt module found"
        else
            print_warning "Production bcrypt module missing"
            all_good=false
        fi
    else
        print_error "Production node_modules missing"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        return 1
    fi
    
    return 0
}

# Function to check package.json files
check_package_json() {
    print_header "Checking Package.json Files"
    
    local all_good=true
    
    # Check development package.json
    if file_exists "$DEV_DIR/package.json"; then
        print_status "Development package.json exists"
    else
        print_error "Development package.json missing"
        all_good=false
    fi
    
    # Check production package.json
    if file_exists "$PROD_DIR/package.json"; then
        print_status "Production package.json exists"
    else
        print_error "Production package.json missing"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        return 1
    fi
    
    return 0
}

# Function to reinstall dependencies
reinstall_dependencies() {
    print_header "Reinstalling Dependencies"
    
    local env="$1"  # "dev" or "prod"
    local app_dir=""
    
    if [ "$env" = "dev" ]; then
        app_dir="$DEV_DIR"
    elif [ "$env" = "prod" ]; then
        app_dir="$PROD_DIR"
    else
        print_error "Invalid environment: $env"
        return 1
    fi
    
    if [ ! -d "$app_dir" ]; then
        print_error "Application directory not found: $app_dir"
        return 1
    fi
    
    print_info "Reinstalling dependencies for $env environment..."
    
    # Stop PM2 process if running
    pm2 stop "${PROJECT_NAME}-${env}" 2>/dev/null || true
    
    # Remove node_modules
    print_info "Removing existing node_modules..."
    rm -rf "$app_dir/node_modules"
    rm -f "$app_dir/package-lock.json"
    
    # Clear npm cache
    print_info "Clearing npm cache..."
    npm cache clean --force
    
    # Install dependencies
    print_info "Installing dependencies..."
    cd "$app_dir"
    
    if npm install; then
        print_status "Dependencies installed successfully for $env"
        
        # Verify critical modules
        if directory_exists "$app_dir/node_modules/bcrypt"; then
            print_status "bcrypt module verified"
        else
            print_error "bcrypt module still missing after installation"
            return 1
        fi
        
        # Restart PM2 process
        print_info "Restarting PM2 process..."
        pm2 restart "${PROJECT_NAME}-${env}" 2>/dev/null || pm2 start "${PROJECT_NAME}-${env}" 2>/dev/null
        
        return 0
    else
        print_error "Failed to install dependencies for $env"
        return 1
    fi
}

# Function to fix specific missing modules
fix_missing_modules() {
    print_header "Fixing Missing Modules"
    
    local env="$1"  # "dev" or "prod"
    local app_dir=""
    
    if [ "$env" = "dev" ]; then
        app_dir="$DEV_DIR"
    elif [ "$env" = "prod" ]; then
        app_dir="$PROD_DIR"
    else
        print_error "Invalid environment: $env"
        return 1
    fi
    
    if [ ! -d "$app_dir" ]; then
        print_error "Application directory not found: $app_dir"
        return 1
    fi
    
    print_info "Installing missing modules for $env environment..."
    
    cd "$app_dir"
    
    # Install specific missing modules
    local missing_modules=("bcrypt" "drizzle-orm" "next" "react" "react-dom")
    
    for module in "${missing_modules[@]}"; do
        print_info "Installing $module..."
        if npm install "$module"; then
            print_status "$module installed successfully"
        else
            print_error "Failed to install $module"
        fi
    done
    
    # Restart PM2 process
    print_info "Restarting PM2 process..."
    pm2 restart "${PROJECT_NAME}-${env}" 2>/dev/null || pm2 start "${PROJECT_NAME}-${env}" 2>/dev/null
    
    return 0
}

# Function to rebuild production application
rebuild_production() {
    print_header "Rebuilding Production Application"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    print_info "Rebuilding production application..."
    
    # Stop production process
    pm2 stop "${PROJECT_NAME}-prod" 2>/dev/null || true
    
    cd "$PROD_DIR"
    
    # Clean build
    print_info "Cleaning build..."
    rm -rf .next
    
    # Install dependencies
    print_info "Installing dependencies..."
    if npm install; then
        print_status "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        return 1
    fi
    
    # Build application
    print_info "Building application..."
    if npm run build; then
        print_status "Application built successfully"
    else
        print_error "Failed to build application"
        return 1
    fi
    
    # Start production process
    print_info "Starting production process..."
    pm2 restart "${PROJECT_NAME}-prod" 2>/dev/null || pm2 start "${PROJECT_NAME}-prod" 2>/dev/null
    
    return 0
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Dependency Fix Script"
    echo "========================"
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Check PM2 Status"
    echo -e "${GREEN}2)${NC} Check Application Directories"
    echo -e "${GREEN}3)${NC} Check Node Modules"
    echo -e "${GREEN}4)${NC} Check Package.json Files"
    echo -e "${GREEN}5)${NC} Reinstall Development Dependencies"
    echo -e "${GREEN}6)${NC} Reinstall Production Dependencies"
    echo -e "${GREEN}7)${NC} Fix Missing Modules (Development)"
    echo -e "${GREEN}8)${NC} Fix Missing Modules (Production)"
    echo -e "${GREEN}9)${NC} Rebuild Production Application"
    echo -e "${GREEN}10)${NC} Auto-Fix All Issues"
    echo -e "${GREEN}11)${NC} Exit"
    echo ""
    echo -e "${YELLOW}Dev Dir: $DEV_DIR${NC}"
    echo -e "${YELLOW}Prod Dir: $PROD_DIR${NC}"
    echo ""
}

# Function to auto-fix all issues
auto_fix_all() {
    print_header "Auto-Fixing All Dependency Issues"
    
    # Check current status
    check_pm2_status || return 1
    check_app_directories || return 1
    check_node_modules || {
        print_warning "Node modules issues detected, will fix..."
    }
    
    # Reinstall dependencies for both environments
    print_info "Reinstalling development dependencies..."
    reinstall_dependencies "dev" || return 1
    
    print_info "Reinstalling production dependencies..."
    reinstall_dependencies "prod" || return 1
    
    # Rebuild production application
    print_info "Rebuilding production application..."
    rebuild_production || return 1
    
    # Final status check
    print_info "Performing final status check..."
    check_pm2_status
    check_node_modules
    
    print_status "All dependency issues have been fixed!"
    return 0
}

# Main script execution
main() {
    # Initialize log files
    touch "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
    
    print_header "Starting Dependency Fix Script"
    print_info "Log file: $LOG_FILE"
    print_info "Error log: $ERROR_LOG"
    
    while true; do
        show_menu
        read -p "Enter your choice (1-11): " choice
        
        case $choice in
            1)
                check_pm2_status
                read -p "Press Enter to continue..."
                ;;
            2)
                check_app_directories
                read -p "Press Enter to continue..."
                ;;
            3)
                check_node_modules
                read -p "Press Enter to continue..."
                ;;
            4)
                check_package_json
                read -p "Press Enter to continue..."
                ;;
            5)
                reinstall_dependencies "dev"
                read -p "Press Enter to continue..."
                ;;
            6)
                reinstall_dependencies "prod"
                read -p "Press Enter to continue..."
                ;;
            7)
                fix_missing_modules "dev"
                read -p "Press Enter to continue..."
                ;;
            8)
                fix_missing_modules "prod"
                read -p "Press Enter to continue..."
                ;;
            9)
                rebuild_production
                read -p "Press Enter to continue..."
                ;;
            10)
                auto_fix_all
                read -p "Press Enter to continue..."
                ;;
            11)
                print_header "Exiting dependency fix script"
                echo ""
                print_info "Dependency fix script completed"
                print_info "Log files available at:"
                print_info "  - $LOG_FILE"
                print_info "  - $ERROR_LOG"
                echo ""
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-11."
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Run main function
main "$@" 