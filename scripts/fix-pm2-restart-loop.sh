#!/bin/bash

# 🔧 PM2 Restart Loop Fix Script
# Fixes PM2 processes stuck in restart loops

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="dintrafikskolax"
DEV_DIR="/var/www/dintrafikskolax_dev"
PROD_DIR="/var/www/dintrafikskolax_prod"
DEV_PORT=3000
PROD_PORT=3001

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${CYAN}📋 $1${NC}"
}

# Function to check PM2 status
check_pm2_status() {
    print_header "Current PM2 Status"
    pm2 list
    echo ""
}

# Function to stop all PM2 processes
stop_all_pm2_processes() {
    print_header "Stopping All PM2 Processes"
    
    # Stop all processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Kill any remaining processes on our ports
    print_info "Killing any remaining processes on ports $DEV_PORT and $PROD_PORT"
    sudo kill -9 $(lsof -ti:$DEV_PORT 2>/dev/null) 2>/dev/null || true
    sudo kill -9 $(lsof -ti:$PROD_PORT 2>/dev/null) 2>/dev/null || true
    
    print_status "All PM2 processes stopped"
    echo ""
}

# Function to clear PM2 logs
clear_pm2_logs() {
    print_header "Clearing PM2 Logs"
    
    # Clear PM2 logs
    pm2 flush 2>/dev/null || true
    
    # Remove log files
    sudo rm -f /var/log/pm2/${PROJECT_NAME}-*.log 2>/dev/null || true
    sudo rm -f /var/log/pm2/${PROJECT_NAME}-*-error-*.log 2>/dev/null || true
    
    print_status "PM2 logs cleared"
    echo ""
}

# Function to check application directories
check_app_directories() {
    print_header "Checking Application Directories"
    
    if [ ! -d "$DEV_DIR" ]; then
        print_error "Development directory not found: $DEV_DIR"
        return 1
    fi
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    print_status "Application directories exist"
    
    # Check package.json files
    if [ ! -f "$DEV_DIR/package.json" ]; then
        print_error "Development package.json not found"
        return 1
    fi
    
    if [ ! -f "$PROD_DIR/package.json" ]; then
        print_error "Production package.json not found"
        return 1
    fi
    
    print_status "Package.json files found"
    echo ""
}

# Function to fix development environment
fix_development_environment() {
    print_header "Fixing Development Environment"
    
    if [ ! -d "$DEV_DIR" ]; then
        print_error "Development directory not found: $DEV_DIR"
        return 1
    fi
    
    cd "$DEV_DIR"
    
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
    sleep 5
    
    # Check status
    local status=$(pm2 list | grep "${PROJECT_NAME}-dev" | awk '{print $10}' 2>/dev/null || echo "unknown")
    if [ "$status" = "online" ]; then
        print_status "Development process started successfully"
        return 0
    else
        print_error "Development process failed to start"
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
    
    cd "$PROD_DIR"
    
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
        return 1
    fi
}

# Function to view PM2 logs
view_pm2_logs() {
    local process_name="$1"
    
    if [ -n "$process_name" ]; then
        print_header "Viewing logs for $process_name"
        pm2 logs "$process_name" --lines 20
    else
        print_header "Viewing all PM2 logs"
        pm2 logs --lines 20
    fi
    echo ""
}

# Function to check port availability
check_port_availability() {
    print_header "Checking Port Availability"
    
    # Check development port
    if lsof -ti:$DEV_PORT >/dev/null 2>&1; then
        print_warning "Port $DEV_PORT is in use"
        lsof -i:$DEV_PORT
    else
        print_status "Port $DEV_PORT is available"
    fi
    
    # Check production port
    if lsof -ti:$PROD_PORT >/dev/null 2>&1; then
        print_warning "Port $PROD_PORT is in use"
        lsof -i:$PROD_PORT
    else
        print_status "Port $PROD_PORT is available"
    fi
    echo ""
}

# Function to auto-fix restart loop
auto_fix_restart_loop() {
    print_header "Auto-Fixing PM2 Restart Loop"
    
    # Step 1: Stop all processes
    stop_all_pm2_processes
    
    # Step 2: Clear logs
    clear_pm2_logs
    
    # Step 3: Check directories
    check_app_directories || {
        print_error "Application directories check failed"
        return 1
    }
    
    # Step 4: Check ports
    check_port_availability
    
    # Step 5: Fix development environment
    fix_development_environment || {
        print_error "Failed to fix development environment"
        return 1
    }
    
    # Step 6: Fix production environment
    fix_production_environment || {
        print_error "Failed to fix production environment"
        return 1
    }
    
    # Step 7: Final status check
    print_header "Final Status Check"
    pm2 list
    
    print_status "Restart loop fix completed"
    echo ""
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 PM2 Restart Loop Fix Script"
    echo "=============================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Check PM2 Status"
    echo -e "${GREEN}2)${NC} Stop All PM2 Processes"
    echo -e "${GREEN}3)${NC} Clear PM2 Logs"
    echo -e "${GREEN}4)${NC} Check Application Directories"
    echo -e "${GREEN}5)${NC} Check Port Availability"
    echo -e "${GREEN}6)${NC} Fix Development Environment"
    echo -e "${GREEN}7)${NC} Fix Production Environment"
    echo -e "${GREEN}8)${NC} View PM2 Logs"
    echo -e "${GREEN}9)${NC} Auto-Fix Restart Loop"
    echo -e "${GREEN}10)${NC} Exit"
    echo ""
}

# Main script execution
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-10): " choice
        
        case $choice in
            1)
                check_pm2_status
                read -p "Press Enter to continue..."
                ;;
            2)
                stop_all_pm2_processes
                read -p "Press Enter to continue..."
                ;;
            3)
                clear_pm2_logs
                read -p "Press Enter to continue..."
                ;;
            4)
                check_app_directories
                read -p "Press Enter to continue..."
                ;;
            5)
                check_port_availability
                read -p "Press Enter to continue..."
                ;;
            6)
                fix_development_environment
                read -p "Press Enter to continue..."
                ;;
            7)
                fix_production_environment
                read -p "Press Enter to continue..."
                ;;
            8)
                read -p "Enter process name (or press Enter for all): " process_name
                view_pm2_logs "$process_name"
                read -p "Press Enter to continue..."
                ;;
            9)
                auto_fix_restart_loop
                read -p "Press Enter to continue..."
                ;;
            10)
                print_header "Exiting PM2 restart loop fix script"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-10."
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Run main function
main "$@" 