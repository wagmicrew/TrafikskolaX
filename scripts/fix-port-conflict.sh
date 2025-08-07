#!/bin/bash

# 🔧 Port Conflict Fix Script
# Fixes PM2 processes using wrong ports

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

# Function to check current port usage
check_port_usage() {
    print_header "Checking Current Port Usage"
    
    echo "Port 3000 (Development):"
    if lsof -ti:3000 >/dev/null 2>&1; then
        print_warning "Port 3000 is in use"
        lsof -i:3000
    else
        print_status "Port 3000 is free"
    fi
    
    echo ""
    echo "Port 3001 (Production):"
    if lsof -ti:3001 >/dev/null 2>&1; then
        print_warning "Port 3001 is in use"
        lsof -i:3001
    else
        print_status "Port 3001 is free"
    fi
    
    echo ""
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port="$1"
    
    print_header "Killing processes on port $port"
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        print_info "Found processes on port $port: $pids"
        echo "$pids" | xargs -r sudo kill -9
        print_status "Killed processes on port $port"
    else
        print_info "No processes found on port $port"
    fi
    
    echo ""
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
    
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    print_status "All PM2 processes stopped"
    echo ""
}

# Function to fix production environment configuration
fix_production_config() {
    print_header "Fixing Production Environment Configuration"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    cd "$PROD_DIR"
    
    # Fix .env.local
    print_info "Updating production .env.local..."
    cat > .env.local << EOF
NODE_ENV=production
PORT=$PROD_PORT
NEXTAUTH_URL=https://dintrafikskolahlm.se
NEXT_PUBLIC_APP_URL=https://dintrafikskolahlm.se
EOF
    
    print_status "Production .env.local updated with PORT=$PROD_PORT"
    
    # Check package.json scripts
    print_info "Checking package.json scripts..."
    if grep -q '"start": "next start"' package.json; then
        print_status "Package.json start script is correct"
    else
        print_warning "Package.json start script may need updating"
    fi
    
    echo ""
}

# Function to fix development environment configuration
fix_development_config() {
    print_header "Fixing Development Environment Configuration"
    
    if [ ! -d "$DEV_DIR" ]; then
        print_error "Development directory not found: $DEV_DIR"
        return 1
    fi
    
    cd "$DEV_DIR"
    
    # Fix .env.local
    print_info "Updating development .env.local..."
    cat > .env.local << EOF
NODE_ENV=development
PORT=$DEV_PORT
NEXTAUTH_URL=http://localhost:$DEV_PORT
NEXT_PUBLIC_APP_URL=http://localhost:$DEV_PORT
EOF
    
    print_status "Development .env.local updated with PORT=$DEV_PORT"
    
    echo ""
}

# Function to restart PM2 processes correctly
restart_pm2_processes() {
    print_header "Restarting PM2 Processes with Correct Ports"
    
    # Start development process
    print_info "Starting development process on port $DEV_PORT..."
    cd "$DEV_DIR"
    pm2 start npm --name "${PROJECT_NAME}-dev" -- run dev
    
    sleep 5
    
    # Start production process
    print_info "Starting production process on port $PROD_PORT..."
    cd "$PROD_DIR"
    pm2 start npm --name "${PROJECT_NAME}-prod" -- start
    
    sleep 10
    
    # Check final status
    print_header "Final PM2 Status"
    pm2 list
    
    echo ""
}

# Function to verify port assignments
verify_port_assignments() {
    print_header "Verifying Port Assignments"
    
    sleep 3
    
    # Check development port
    if lsof -ti:$DEV_PORT >/dev/null 2>&1; then
        print_status "Development process is running on port $DEV_PORT"
        lsof -i:$DEV_PORT
    else
        print_error "Development process is not running on port $DEV_PORT"
    fi
    
    echo ""
    
    # Check production port
    if lsof -ti:$PROD_PORT >/dev/null 2>&1; then
        print_status "Production process is running on port $PROD_PORT"
        lsof -i:$PROD_PORT
    else
        print_error "Production process is not running on port $PROD_PORT"
    fi
    
    echo ""
}

# Function to auto-fix port conflicts
auto_fix_port_conflicts() {
    print_header "Auto-Fixing Port Conflicts"
    
    # Step 1: Check current status
    check_pm2_status
    
    # Step 2: Check port usage
    check_port_usage
    
    # Step 3: Kill conflicting processes
    kill_port_processes 3000
    kill_port_processes 3001
    
    # Step 4: Stop all PM2 processes
    stop_all_pm2_processes
    
    # Step 5: Fix configurations
    fix_development_config || {
        print_error "Failed to fix development configuration"
        return 1
    }
    
    fix_production_config || {
        print_error "Failed to fix production configuration"
        return 1
    }
    
    # Step 6: Restart PM2 processes
    restart_pm2_processes
    
    # Step 7: Verify assignments
    verify_port_assignments
    
    print_status "Port conflict fix completed"
    echo ""
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Port Conflict Fix Script"
    echo "=========================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Check Current Port Usage"
    echo -e "${GREEN}2)${NC} Check PM2 Status"
    echo -e "${GREEN}3)${NC} Kill Processes on Port 3000"
    echo -e "${GREEN}4)${NC} Kill Processes on Port 3001"
    echo -e "${GREEN}5)${NC} Stop All PM2 Processes"
    echo -e "${GREEN}6)${NC} Fix Development Config"
    echo -e "${GREEN}7)${NC} Fix Production Config"
    echo -e "${GREEN}8)${NC} Restart PM2 Processes"
    echo -e "${GREEN}9)${NC} Verify Port Assignments"
    echo -e "${GREEN}10)${NC} Auto-Fix Port Conflicts"
    echo -e "${GREEN}11)${NC} Exit"
    echo ""
}

# Main script execution
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-11): " choice
        
        case $choice in
            1)
                check_port_usage
                read -p "Press Enter to continue..."
                ;;
            2)
                check_pm2_status
                read -p "Press Enter to continue..."
                ;;
            3)
                kill_port_processes 3000
                read -p "Press Enter to continue..."
                ;;
            4)
                kill_port_processes 3001
                read -p "Press Enter to continue..."
                ;;
            5)
                stop_all_pm2_processes
                read -p "Press Enter to continue..."
                ;;
            6)
                fix_development_config
                read -p "Press Enter to continue..."
                ;;
            7)
                fix_production_config
                read -p "Press Enter to continue..."
                ;;
            8)
                restart_pm2_processes
                read -p "Press Enter to continue..."
                ;;
            9)
                verify_port_assignments
                read -p "Press Enter to continue..."
                ;;
            10)
                auto_fix_port_conflicts
                read -p "Press Enter to continue..."
                ;;
            11)
                print_header "Exiting port conflict fix script"
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