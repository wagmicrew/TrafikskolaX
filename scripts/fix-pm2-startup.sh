#!/bin/bash

# 🔧 PM2 Startup Fix Script for Din Trafikskola Hässleholm
# Fixes PM2 processes stuck in "starting" status

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
DEV_PORT=3000
PROD_PORT=3001

# Log file
LOG_FILE="/var/log/pm2-startup-fix.log"
ERROR_LOG="/var/log/pm2-startup-fix-errors.log"

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
        
        # Get PM2 list
        local pm2_list=$(pm2 list 2>/dev/null)
        echo "$pm2_list"
        
        # Check specific processes
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
        
        # Check for critical files
        if file_exists "$DEV_DIR/package.json"; then
            print_status "Development package.json exists"
        else
            print_error "Development package.json missing"
            all_good=false
        fi
        
        if directory_exists "$DEV_DIR/node_modules"; then
            print_status "Development node_modules exists"
        else
            print_error "Development node_modules missing"
            all_good=false
        fi
    else
        print_error "Development directory missing: $DEV_DIR"
        all_good=false
    fi
    
    if directory_exists "$PROD_DIR"; then
        print_status "Production directory exists: $PROD_DIR"
        
        # Check for critical files
        if file_exists "$PROD_DIR/package.json"; then
            print_status "Production package.json exists"
        else
            print_error "Production package.json missing"
            all_good=false
        fi
        
        if directory_exists "$PROD_DIR/node_modules"; then
            print_status "Production node_modules exists"
        else
            print_error "Production node_modules missing"
            all_good=false
        fi
        
        if directory_exists "$PROD_DIR/.next"; then
            print_status "Production build exists"
        else
            print_warning "Production build missing (.next directory)"
        fi
    else
        print_error "Production directory missing: $PROD_DIR"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        return 1
    fi
    
    return 0
}

# Function to check environment files
check_environment_files() {
    print_header "Checking Environment Files"
    
    local all_good=true
    
    # Check development environment
    if file_exists "$DEV_DIR/.env.local"; then
        print_status "Development .env.local exists"
        
        # Check for critical environment variables
        if grep -q "NODE_ENV" "$DEV_DIR/.env.local"; then
            print_status "NODE_ENV found in development env"
        else
            print_warning "NODE_ENV missing in development env"
        fi
        
        if grep -q "PORT" "$DEV_DIR/.env.local"; then
            print_status "PORT found in development env"
        else
            print_warning "PORT missing in development env"
        fi
    else
        print_error "Development .env.local missing"
        all_good=false
    fi
    
    # Check production environment
    if file_exists "$PROD_DIR/.env.local"; then
        print_status "Production .env.local exists"
        
        # Check for critical environment variables
        if grep -q "NODE_ENV" "$PROD_DIR/.env.local"; then
            print_status "NODE_ENV found in production env"
        else
            print_warning "NODE_ENV missing in production env"
        fi
        
        if grep -q "PORT" "$PROD_DIR/.env.local"; then
            print_status "PORT found in production env"
        else
            print_warning "PORT missing in production env"
        fi
    else
        print_error "Production .env.local missing"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        return 1
    fi
    
    return 0
}

# Function to check port availability
check_port_availability() {
    print_header "Checking Port Availability"
    
    local all_good=true
    
    # Check development port
    if netstat -tlnp 2>/dev/null | grep -q ":$DEV_PORT "; then
        print_warning "Port $DEV_PORT is in use"
        netstat -tlnp 2>/dev/null | grep ":$DEV_PORT "
    else
        print_status "Port $DEV_PORT is available"
    fi
    
    # Check production port
    if netstat -tlnp 2>/dev/null | grep -q ":$PROD_PORT "; then
        print_warning "Port $PROD_PORT is in use"
        netstat -tlnp 2>/dev/null | grep ":$PROD_PORT "
    else
        print_status "Port $PROD_PORT is available"
    fi
    
    return 0
}

# Function to view PM2 logs
view_pm2_logs() {
    print_header "Viewing PM2 Logs"
    
    local app_name="$1"
    
    if [ -z "$app_name" ]; then
        print_info "Recent logs for all PM2 processes:"
        pm2 logs --lines 20 2>/dev/null || print_error "Failed to get PM2 logs"
    else
        print_info "Recent logs for $app_name:"
        pm2 logs "$app_name" --lines 20 2>/dev/null || print_error "Failed to get logs for $app_name"
    fi
}

# Function to stop all PM2 processes
stop_all_pm2_processes() {
    print_header "Stopping All PM2 Processes"
    
    print_info "Stopping all PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Wait a moment
    sleep 3
    
    # Check if processes are stopped
    local running_processes=$(pm2 list | grep -v "┌─" | grep -v "│" | grep -v "└─" | grep -v "PM2" | grep -v "App name" | grep -v "id" | wc -l)
    
    if [ "$running_processes" -eq 0 ]; then
        print_status "All PM2 processes stopped"
    else
        print_warning "Some PM2 processes may still be running"
    fi
    
    return 0
}

# Function to fix development environment
fix_development_environment() {
    print_header "Fixing Development Environment"
    
    if [ ! -d "$DEV_DIR" ]; then
        print_error "Development directory not found: $DEV_DIR"
        return 1
    fi
    
    print_info "Fixing development environment..."
    
    cd "$DEV_DIR"
    
    # Stop development process
    pm2 stop "${PROJECT_NAME}-dev" 2>/dev/null || true
    pm2 delete "${PROJECT_NAME}-dev" 2>/dev/null || true
    
    # Ensure .env.local has correct settings
    if [ ! -f ".env.local" ]; then
        print_info "Creating development .env.local..."
        cat > .env.local << EOF
NODE_ENV=development
PORT=$DEV_PORT
NEXTAUTH_URL=http://localhost:$DEV_PORT
NEXT_PUBLIC_APP_URL=http://localhost:$DEV_PORT
EOF
    else
        # Update existing .env.local
        print_info "Updating development .env.local..."
        sed -i 's/NODE_ENV=.*/NODE_ENV=development/' .env.local 2>/dev/null || true
        sed -i 's/PORT=.*/PORT='$DEV_PORT'/' .env.local 2>/dev/null || true
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing development dependencies..."
        npm install
    fi
    
    # Start development process
    print_info "Starting development process..."
    pm2 start npm --name "${PROJECT_NAME}-dev" -- run dev
    
    # Wait for startup
    sleep 10
    
    # Check status
    local status=$(pm2 list | grep "${PROJECT_NAME}-dev" | awk '{print $10}' 2>/dev/null || echo "unknown")
    if [ "$status" = "online" ]; then
        print_status "Development process started successfully"
        return 0
    else
        print_error "Development process failed to start"
        view_pm2_logs "${PROJECT_NAME}-dev"
        return 1
    fi
}

# Function to fix production environment
fix_production_environment() {
    print_header "Fixing Production Environment"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    print_info "Fixing production environment..."
    
    cd "$PROD_DIR"
    
    # Stop production process
    pm2 stop "${PROJECT_NAME}-prod" 2>/dev/null || true
    pm2 delete "${PROJECT_NAME}-prod" 2>/dev/null || true
    
    # Ensure .env.local has correct settings
    if [ ! -f ".env.local" ]; then
        print_info "Creating production .env.local..."
        cat > .env.local << EOF
NODE_ENV=production
PORT=$PROD_PORT
NEXTAUTH_URL=https://dintrafikskolahlm.se
NEXT_PUBLIC_APP_URL=https://dintrafikskolahlm.se
EOF
    else
        # Update existing .env.local
        print_info "Updating production .env.local..."
        sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env.local 2>/dev/null || true
        sed -i 's/PORT=.*/PORT='$PROD_PORT'/' .env.local 2>/dev/null || true
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing production dependencies..."
        npm install
    fi
    
    # Build application if needed
    if [ ! -d ".next" ]; then
        print_info "Building production application..."
        npm run build
    fi
    
    # Start production process
    print_info "Starting production process..."
    pm2 start npm --name "${PROJECT_NAME}-prod" -- start
    
    # Wait for startup
    sleep 10
    
    # Check status
    local status=$(pm2 list | grep "${PROJECT_NAME}-prod" | awk '{print $10}' 2>/dev/null || echo "unknown")
    if [ "$status" = "online" ]; then
        print_status "Production process started successfully"
        return 0
    else
        print_error "Production process failed to start"
        view_pm2_logs "${PROJECT_NAME}-prod"
        return 1
    fi
}

# Function to restart PM2 processes
restart_pm2_processes() {
    print_header "Restarting PM2 Processes"
    
    print_info "Restarting all PM2 processes..."
    pm2 restart all
    
    # Wait for restart
    sleep 5
    
    # Check status
    check_pm2_status
    
    return 0
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 PM2 Startup Fix Script"
    echo "========================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Check PM2 Status"
    echo -e "${GREEN}2)${NC} Check Application Directories"
    echo -e "${GREEN}3)${NC} Check Environment Files"
    echo -e "${GREEN}4)${NC} Check Port Availability"
    echo -e "${GREEN}5)${NC} View PM2 Logs"
    echo -e "${GREEN}6)${NC} Stop All PM2 Processes"
    echo -e "${GREEN}7)${NC} Fix Development Environment"
    echo -e "${GREEN}8)${NC} Fix Production Environment"
    echo -e "${GREEN}9)${NC} Restart PM2 Processes"
    echo -e "${GREEN}10)${NC} Auto-Fix All PM2 Issues"
    echo -e "${GREEN}11)${NC} Exit"
    echo ""
    echo -e "${YELLOW}Dev Dir: $DEV_DIR${NC}"
    echo -e "${YELLOW}Prod Dir: $PROD_DIR${NC}"
    echo ""
}

# Function to auto-fix all PM2 issues
auto_fix_pm2_issues() {
    print_header "Auto-Fixing All PM2 Issues"
    
    # Check current status
    check_pm2_status
    check_app_directories || return 1
    check_environment_files || return 1
    check_port_availability
    
    # Stop all processes
    print_info "Stopping all PM2 processes..."
    stop_all_pm2_processes
    
    # Fix development environment
    print_info "Fixing development environment..."
    fix_development_environment || return 1
    
    # Fix production environment
    print_info "Fixing production environment..."
    fix_production_environment || return 1
    
    # Final status check
    print_info "Performing final status check..."
    check_pm2_status
    
    print_status "All PM2 issues have been fixed!"
    return 0
}

# Main script execution
main() {
    # Initialize log files
    touch "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
    
    print_header "Starting PM2 Startup Fix Script"
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
                check_environment_files
                read -p "Press Enter to continue..."
                ;;
            4)
                check_port_availability
                read -p "Press Enter to continue..."
                ;;
            5)
                view_pm2_logs
                read -p "Press Enter to continue..."
                ;;
            6)
                stop_all_pm2_processes
                read -p "Press Enter to continue..."
                ;;
            7)
                fix_development_environment
                read -p "Press Enter to continue..."
                ;;
            8)
                fix_production_environment
                read -p "Press Enter to continue..."
                ;;
            9)
                restart_pm2_processes
                read -p "Press Enter to continue..."
                ;;
            10)
                auto_fix_pm2_issues
                read -p "Press Enter to continue..."
                ;;
            11)
                print_header "Exiting PM2 startup fix script"
                echo ""
                print_info "PM2 startup fix script completed"
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