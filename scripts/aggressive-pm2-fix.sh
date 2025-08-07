#!/bin/bash

# 🔧 Aggressive PM2 Fix Script
# Completely stops all processes and fixes port conflicts

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

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to aggressively kill all processes
aggressive_kill_all() {
    print_header "Aggressively Killing All Processes"
    
    # Stop all PM2 processes
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
    
    # Kill any remaining processes that might be using our ports
    for port in 3000 3001 3002 3003 3004 3005; do
        sudo kill -9 $(lsof -ti:$port 2>/dev/null) 2>/dev/null || true
    done
    
    # Clear PM2 logs and cache
    print_info "Clearing PM2 logs and cache..."
    pm2 flush 2>/dev/null || true
    sudo rm -f /var/log/pm2/${PROJECT_NAME}-*.log 2>/dev/null || true
    sudo rm -f /root/.pm2/logs/${PROJECT_NAME}-*.log 2>/dev/null || true
    
    # Wait a moment for processes to fully stop
    sleep 3
    
    print_status "All processes aggressively killed"
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

# Function to fix application configurations with verification
fix_app_configs_with_verification() {
    print_header "Fixing Application Configurations with Verification"
    
    # Fix development configuration
    if [ -d "$DEV_DIR" ]; then
        print_info "Fixing development configuration..."
        cd "$DEV_DIR"
        
        # Remove existing .env.local
        rm -f .env.local
        
        # Create proper .env.local for development
        cat > .env.local << EOF
NODE_ENV=development
PORT=$DEV_PORT
NEXTAUTH_URL=https://dev.dintrafikskolahlm.se
NEXT_PUBLIC_APP_URL=https://dev.dintrafikskolahlm.se
EOF
        
        # Verify the file was created correctly
        if grep -q "PORT=$DEV_PORT" .env.local; then
            print_status "Development configuration fixed and verified"
        else
            print_error "Development configuration failed"
            return 1
        fi
    else
        print_error "Development directory not found: $DEV_DIR"
        return 1
    fi
    
    # Fix production configuration
    if [ -d "$PROD_DIR" ]; then
        print_info "Fixing production configuration..."
        cd "$PROD_DIR"
        
        # Remove existing .env.local
        rm -f .env.local
        
        # Create proper .env.local for production
        cat > .env.local << EOF
NODE_ENV=production
PORT=$PROD_PORT
NEXTAUTH_URL=https://dintrafikskolahlm.se
NEXT_PUBLIC_APP_URL=https://dintrafikskolahlm.se
EOF
        
        # Verify the file was created correctly
        if grep -q "PORT=$PROD_PORT" .env.local; then
            print_status "Production configuration fixed and verified"
        else
            print_error "Production configuration failed"
            return 1
        fi
    else
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    echo ""
}

# Function to start development process first
start_development_first() {
    print_header "Starting Development Process First"
    
    if [ ! -d "$DEV_DIR" ]; then
        print_error "Development directory not found: $DEV_DIR"
        return 1
    fi
    
    cd "$DEV_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing development dependencies..."
        npm install
    fi
    
    # Start development process
    print_info "Starting development process on port $DEV_PORT..."
    pm2 start npm --name "${PROJECT_NAME}-dev" -- run dev
    
    # Wait and check if it started successfully
    sleep 10
    
    # Check if process is running and port is in use
    if pm2 list | grep -q "${PROJECT_NAME}-dev.*online"; then
        if lsof -ti:$DEV_PORT >/dev/null 2>&1; then
            print_status "Development process started successfully on port $DEV_PORT"
            return 0
        else
            print_error "Development process started but port $DEV_PORT is not in use"
            return 1
        fi
    else
        print_error "Development process failed to start"
        pm2 logs "${PROJECT_NAME}-dev" --lines 10
        return 1
    fi
}

# Function to start production process
start_production_process() {
    print_header "Starting Production Process"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
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
    
    # Start production process
    print_info "Starting production process on port $PROD_PORT..."
    pm2 start npm --name "${PROJECT_NAME}-prod" -- start
    
    # Wait and check if it started successfully
    sleep 15
    
    # Check if process is running and port is in use
    if pm2 list | grep -q "${PROJECT_NAME}-prod.*online"; then
        if lsof -ti:$PROD_PORT >/dev/null 2>&1; then
            print_status "Production process started successfully on port $PROD_PORT"
            return 0
        else
            print_error "Production process started but port $PROD_PORT is not in use"
            return 1
        fi
    else
        print_error "Production process failed to start"
        pm2 logs "${PROJECT_NAME}-prod" --lines 10
        return 1
    fi
}

# Function to verify final setup
verify_final_setup() {
    print_header "Verifying Final Setup"
    
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
    
    echo ""
}

# Function to auto-fix everything aggressively
auto_fix_aggressively() {
    print_header "Auto-Fixing Everything Aggressively"
    
    # Step 1: Check root privileges
    check_root
    
    # Step 2: Aggressively kill all processes
    aggressive_kill_all
    
    # Step 3: Verify ports are free
    verify_ports_free || {
        print_error "Ports are still in use after killing processes"
        return 1
    }
    
    # Step 4: Fix application configurations
    fix_app_configs_with_verification || {
        print_error "Failed to fix application configurations"
        return 1
    }
    
    # Step 5: Start development process first
    start_development_first || {
        print_error "Failed to start development process"
        return 1
    }
    
    # Step 6: Start production process
    start_production_process || {
        print_error "Failed to start production process"
        return 1
    }
    
    # Step 7: Verify final setup
    verify_final_setup
    
    print_status "Aggressive PM2 fix completed successfully"
    echo ""
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Aggressive PM2 Fix Script"
    echo "============================"
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Aggressively Kill All Processes"
    echo -e "${GREEN}2)${NC} Verify Ports Are Free"
    echo -e "${GREEN}3)${NC} Fix App Configurations with Verification"
    echo -e "${GREEN}4)${NC} Start Development Process First"
    echo -e "${GREEN}5)${NC} Start Production Process"
    echo -e "${GREEN}6)${NC} Verify Final Setup"
    echo -e "${GREEN}7)${NC} Auto-Fix Everything Aggressively"
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
                aggressive_kill_all
                read -p "Press Enter to continue..."
                ;;
            2)
                verify_ports_free
                read -p "Press Enter to continue..."
                ;;
            3)
                fix_app_configs_with_verification
                read -p "Press Enter to continue..."
                ;;
            4)
                start_development_first
                read -p "Press Enter to continue..."
                ;;
            5)
                start_production_process
                read -p "Press Enter to continue..."
                ;;
            6)
                verify_final_setup
                read -p "Press Enter to continue..."
                ;;
            7)
                auto_fix_aggressively
                read -p "Press Enter to continue..."
                ;;
            8)
                print_header "Exiting aggressive PM2 fix script"
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