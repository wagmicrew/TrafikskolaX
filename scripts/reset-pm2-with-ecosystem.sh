#!/bin/bash

# 🔧 PM2 Reset with Ecosystem Configuration
# Completely resets PM2 and uses ecosystem.config.js

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
ECOSYSTEM_FILE="/var/www/dintrafikskolax_prod/ecosystem.config.js"

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

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to completely reset PM2
reset_pm2_completely() {
    print_header "Completely Resetting PM2"
    
    # Stop and delete all PM2 processes
    print_info "Stopping all PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Kill all Node.js processes
    print_info "Killing all Node.js processes..."
    pkill -f "node" 2>/dev/null || true
    pkill -f "npm" 2>/dev/null || true
    pkill -f "next" 2>/dev/null || true
    
    # Kill processes on specific ports
    print_info "Killing processes on ports $DEV_PORT and $PROD_PORT..."
    sudo kill -9 $(lsof -ti:$DEV_PORT 2>/dev/null) 2>/dev/null || true
    sudo kill -9 $(lsof -ti:$PROD_PORT 2>/dev/null) 2>/dev/null || true
    
    # Clear PM2 logs and cache
    print_info "Clearing PM2 logs and cache..."
    pm2 flush 2>/dev/null || true
    sudo rm -f /var/log/pm2/${PROJECT_NAME}-*.log 2>/dev/null || true
    sudo rm -f /root/.pm2/logs/${PROJECT_NAME}-*.log 2>/dev/null || true
    
    # Reset PM2 daemon
    print_info "Resetting PM2 daemon..."
    pm2 kill 2>/dev/null || true
    pm2 resurrect 2>/dev/null || true
    
    # Wait for cleanup
    sleep 3
    
    print_status "PM2 completely reset"
    echo ""
}

# Function to verify ports are free
verify_ports_free() {
    print_header "Verifying Ports Are Free"
    
    # Check port 3000
    if lsof -ti:$DEV_PORT >/dev/null 2>&1; then
        print_warning "Port $DEV_PORT is still in use"
        lsof -i:$DEV_PORT
        return 1
    else
        print_status "Port $DEV_PORT is free"
    fi
    
    # Check port 3001
    if lsof -ti:$PROD_PORT >/dev/null 2>&1; then
        print_warning "Port $PROD_PORT is still in use"
        lsof -i:$PROD_PORT
        return 1
    else
        print_status "Port $PROD_PORT is free"
    fi
    
    echo ""
}

# Function to copy ecosystem file to production directory
copy_ecosystem_file() {
    print_header "Copying Ecosystem Configuration"
    
    if [ ! -f "ecosystem.config.js" ]; then
        print_error "ecosystem.config.js not found in current directory"
        return 1
    fi
    
    # Copy to production directory
    cp ecosystem.config.js "$PROD_DIR/"
    
    if [ -f "$PROD_DIR/ecosystem.config.js" ]; then
        print_status "Ecosystem file copied to production directory"
    else
        print_error "Failed to copy ecosystem file"
        return 1
    fi
    
    echo ""
}

# Function to verify ecosystem configuration
verify_ecosystem_config() {
    print_header "Verifying Ecosystem Configuration"
    
    if [ ! -f "$ECOSYSTEM_FILE" ]; then
        print_error "Ecosystem file not found: $ECOSYSTEM_FILE"
        return 1
    fi
    
    # Check if configuration is correct
    if grep -q "PORT: 3000" "$ECOSYSTEM_FILE" && grep -q "PORT: 3001" "$ECOSYSTEM_FILE"; then
        print_status "Ecosystem configuration verified"
    else
        print_error "Ecosystem configuration is incorrect"
        return 1
    fi
    
    echo ""
}

# Function to start applications using ecosystem file
start_with_ecosystem() {
    print_header "Starting Applications with Ecosystem Configuration"
    
    if [ ! -f "$ECOSYSTEM_FILE" ]; then
        print_error "Ecosystem file not found: $ECOSYSTEM_FILE"
        return 1
    fi
    
    cd "$PROD_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing production dependencies..."
        npm install
    fi
    
    # Build if needed
    if [ ! -d ".next" ]; then
        print_info "Building production application..."
        npm run build
    fi
    
    # Install development dependencies if needed
    if [ ! -d "$DEV_DIR/node_modules" ]; then
        print_info "Installing development dependencies..."
        cd "$DEV_DIR"
        npm install
        cd "$PROD_DIR"
    fi
    
    # Start applications using ecosystem file
    print_info "Starting applications with ecosystem configuration..."
    pm2 start ecosystem.config.js
    
    # Wait for startup
    sleep 15
    
    # Check status
    print_info "Checking PM2 status..."
    pm2 list
    
    echo ""
}

# Function to verify applications are running correctly
verify_applications() {
    print_header "Verifying Applications Are Running Correctly"
    
    # Check PM2 processes
    print_info "PM2 Process Status:"
    pm2 list
    
    # Check port usage
    print_info "Port Usage:"
    echo "Port $DEV_PORT (Development):"
    lsof -i:$DEV_PORT 2>/dev/null || echo "No process found"
    
    echo "Port $PROD_PORT (Production):"
    lsof -i:$PROD_PORT 2>/dev/null || echo "No process found"
    
    # Check process details
    print_info "Process Details:"
    ps aux | grep -E "(node|npm)" | grep -v grep || echo "No Node.js processes found"
    
    # Check logs
    print_info "Recent Logs:"
    echo "Development logs:"
    pm2 logs dintrafikskolax-dev --lines 5 2>/dev/null || echo "No development logs"
    
    echo "Production logs:"
    pm2 logs dintrafikskolax-prod --lines 5 2>/dev/null || echo "No production logs"
    
    echo ""
}

# Function to auto-reset and start with ecosystem
auto_reset_with_ecosystem() {
    print_header "Auto-Reset and Start with Ecosystem"
    
    # Step 1: Check root privileges
    check_root
    
    # Step 2: Completely reset PM2
    reset_pm2_completely
    
    # Step 3: Verify ports are free
    verify_ports_free || {
        print_error "Ports are still in use after reset"
        return 1
    }
    
    # Step 4: Copy ecosystem file
    copy_ecosystem_file || {
        print_error "Failed to copy ecosystem file"
        return 1
    }
    
    # Step 5: Verify ecosystem configuration
    verify_ecosystem_config || {
        print_error "Failed to verify ecosystem configuration"
        return 1
    }
    
    # Step 6: Start applications with ecosystem
    start_with_ecosystem || {
        print_error "Failed to start applications with ecosystem"
        return 1
    }
    
    # Step 7: Verify applications
    verify_applications
    
    print_status "PM2 reset and start with ecosystem completed successfully"
    echo ""
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 PM2 Reset with Ecosystem Configuration"
    echo "======================================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Completely Reset PM2"
    echo -e "${GREEN}2)${NC} Verify Ports Are Free"
    echo -e "${GREEN}3)${NC} Copy Ecosystem File"
    echo -e "${GREEN}4)${NC} Verify Ecosystem Configuration"
    echo -e "${GREEN}5)${NC} Start with Ecosystem"
    echo -e "${GREEN}6)${NC} Verify Applications"
    echo -e "${GREEN}7)${NC} Auto-Reset and Start with Ecosystem"
    echo -e "${GREEN}8)${NC} Exit"
    echo ""
}

# Main script execution
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-8): " choice
        
        case $choice in
            1)
                reset_pm2_completely
                read -p "Press Enter to continue..."
                ;;
            2)
                verify_ports_free
                read -p "Press Enter to continue..."
                ;;
            3)
                copy_ecosystem_file
                read -p "Press Enter to continue..."
                ;;
            4)
                verify_ecosystem_config
                read -p "Press Enter to continue..."
                ;;
            5)
                start_with_ecosystem
                read -p "Press Enter to continue..."
                ;;
            6)
                verify_applications
                read -p "Press Enter to continue..."
                ;;
            7)
                auto_reset_with_ecosystem
                read -p "Press Enter to continue..."
                ;;
            8)
                print_header "Exiting PM2 reset with ecosystem script"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-8."
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Run main function
main "$@" 