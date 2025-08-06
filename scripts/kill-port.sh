#!/bin/bash

# 🔧 Port Killer Script for Ubuntu
# Kills processes using specific ports

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

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

# Function to kill process on specific port
kill_port() {
    local port="$1"
    
    print_header "Killing process on port $port"
    
    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        print_info "Found process PID: $pid using port $port"
        
        # Show process details
        print_info "Process details:"
        ps -p "$pid" -o pid,ppid,cmd --no-headers 2>/dev/null || print_warning "Could not get process details"
        
        # Kill the process
        print_info "Killing process..."
        kill -9 "$pid"
        
        if [ $? -eq 0 ]; then
            print_status "Successfully killed process on port $port"
        else
            print_error "Failed to kill process on port $port"
            return 1
        fi
        
        # Verify port is free
        sleep 2
        if lsof -ti:$port >/dev/null 2>&1; then
            print_warning "Port $port is still in use"
            return 1
        else
            print_status "Port $port is now free"
        fi
    else
        print_warning "No process found using port $port"
    fi
    
    return 0
}

# Function to show all processes using ports
show_port_processes() {
    local port="$1"
    
    print_header "Showing processes using port $port"
    
    if command -v lsof >/dev/null 2>&1; then
        print_info "Using lsof to find processes:"
        lsof -i:$port 2>/dev/null || print_warning "No processes found with lsof"
    fi
    
    if command -v netstat >/dev/null 2>&1; then
        print_info "Using netstat to find processes:"
        netstat -tlnp 2>/dev/null | grep ":$port " || print_warning "No processes found with netstat"
    fi
    
    if command -v ss >/dev/null 2>&1; then
        print_info "Using ss to find processes:"
        ss -tlnp 2>/dev/null | grep ":$port " || print_warning "No processes found with ss"
    fi
}

# Function to show all listening ports
show_all_ports() {
    print_header "Showing all listening ports"
    
    print_info "Common application ports:"
    echo "3000 - Development server"
    echo "3001 - Production server"
    echo "80   - HTTP"
    echo "443  - HTTPS"
    echo "22   - SSH"
    echo ""
    
    print_info "All listening ports:"
    if command -v netstat >/dev/null 2>&1; then
        netstat -tlnp 2>/dev/null | grep LISTEN
    elif command -v ss >/dev/null 2>&1; then
        ss -tlnp 2>/dev/null | grep LISTEN
    else
        print_error "Neither netstat nor ss is available"
    fi
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Port Killer Script"
    echo "===================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Kill process on port 3000 (Development)"
    echo -e "${GREEN}2)${NC} Kill process on port 3001 (Production)"
    echo -e "${GREEN}3)${NC} Kill process on custom port"
    echo -e "${GREEN}4)${NC} Show processes on port 3000"
    echo -e "${GREEN}5)${NC} Show processes on port 3001"
    echo -e "${GREEN}6)${NC} Show processes on custom port"
    echo -e "${GREEN}7)${NC} Show all listening ports"
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
                kill_port 3000
                read -p "Press Enter to continue..."
                ;;
            2)
                kill_port 3001
                read -p "Press Enter to continue..."
                ;;
            3)
                read -p "Enter port number: " custom_port
                if [[ "$custom_port" =~ ^[0-9]+$ ]]; then
                    kill_port "$custom_port"
                else
                    print_error "Invalid port number"
                fi
                read -p "Press Enter to continue..."
                ;;
            4)
                show_port_processes 3000
                read -p "Press Enter to continue..."
                ;;
            5)
                show_port_processes 3001
                read -p "Press Enter to continue..."
                ;;
            6)
                read -p "Enter port number: " custom_port
                if [[ "$custom_port" =~ ^[0-9]+$ ]]; then
                    show_port_processes "$custom_port"
                else
                    print_error "Invalid port number"
                fi
                read -p "Press Enter to continue..."
                ;;
            7)
                show_all_ports
                read -p "Press Enter to continue..."
                ;;
            8)
                print_header "Exiting port killer script"
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