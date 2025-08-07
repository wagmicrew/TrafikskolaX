#!/bin/bash

# 🔧 Redis Setup and Build Fix Script
# Installs Redis, fixes build issues, and sets up environment

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

# Function to install Redis
install_redis() {
    print_header "Installing Redis"
    
    # Update package list
    apt update
    
    # Install Redis
    print_info "Installing Redis server..."
    apt install -y redis-server
    
    # Configure Redis for better performance
    print_info "Configuring Redis..."
    cat > /etc/redis/redis.conf << EOF
# Redis configuration for web applications
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 60
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
EOF
    
    # Start and enable Redis
    systemctl enable redis-server
    systemctl restart redis-server
    
    # Test Redis
    if redis-cli ping | grep -q "PONG"; then
        print_status "Redis is running and responding"
    else
        print_error "Redis failed to start"
        return 1
    fi
    
    echo ""
}

# Function to install Redis npm package
install_redis_npm() {
    print_header "Installing Redis NPM Package"
    
    # Install in development directory
    if [ -d "$DEV_DIR" ]; then
        print_info "Installing Redis in development directory..."
        cd "$DEV_DIR"
        npm install redis
    fi
    
    # Install in production directory
    if [ -d "$PROD_DIR" ]; then
        print_info "Installing Redis in production directory..."
        cd "$PROD_DIR"
        npm install redis
    fi
    
    print_status "Redis NPM package installed"
    echo ""
}

# Function to fix build issues
fix_build_issues() {
    print_header "Fixing Build Issues"
    
    # Fix development environment
    if [ -d "$DEV_DIR" ]; then
        print_info "Fixing development environment..."
        cd "$DEV_DIR"
        
        # Clear Next.js cache
        rm -rf .next
        rm -rf node_modules/.cache
        
        # Reinstall dependencies
        npm install
        
        print_status "Development environment fixed"
    fi
    
    # Fix production environment
    if [ -d "$PROD_DIR" ]; then
        print_info "Fixing production environment..."
        cd "$PROD_DIR"
        
        # Clear Next.js cache
        rm -rf .next
        rm -rf node_modules/.cache
        
        # Reinstall dependencies
        npm install
        
        # Build application
        print_info "Building production application..."
        npm run build
        
        print_status "Production environment fixed"
    fi
    
    echo ""
}

# Function to set up environment variables
setup_environment() {
    print_header "Setting up Environment Variables"
    
    # Create .env.local for development
    if [ -d "$DEV_DIR" ]; then
        print_info "Setting up development environment..."
        cd "$DEV_DIR"
        
        cat > .env.local << EOF
NODE_ENV=development
PORT=3000
NEXTAUTH_URL=https://dev.dintrafikskolahlm.se
NEXT_PUBLIC_APP_URL=https://dev.dintrafikskolahlm.se
DATABASE_URL=${DATABASE_URL}
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
QLIRO_MERCHANT_ID=${QLIRO_MERCHANT_ID}
QLIRO_SHARED_SECRET=${QLIRO_SHARED_SECRET}
SWISH_MERCHANT_ID=${SWISH_MERCHANT_ID}
SWISH_CERT_PATH=${SWISH_CERT_PATH}
SWISH_CERT_PASSWORD=${SWISH_CERT_PASSWORD}
EOF
        
        print_status "Development environment variables set"
    fi
    
    # Create .env.local for production
    if [ -d "$PROD_DIR" ]; then
        print_info "Setting up production environment..."
        cd "$PROD_DIR"
        
        cat > .env.local << EOF
NODE_ENV=production
PORT=3001
NEXTAUTH_URL=https://dintrafikskolahlm.se
NEXT_PUBLIC_APP_URL=https://dintrafikskolahlm.se
DATABASE_URL=${DATABASE_URL}
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
QLIRO_MERCHANT_ID=${QLIRO_MERCHANT_ID}
QLIRO_SHARED_SECRET=${QLIRO_SHARED_SECRET}
SWISH_MERCHANT_ID=${SWISH_MERCHANT_ID}
SWISH_CERT_PATH=${SWISH_CERT_PATH}
SWISH_CERT_PASSWORD=${SWISH_CERT_PASSWORD}
EOF
        
        print_status "Production environment variables set"
    fi
    
    echo ""
}

# Function to restart PM2 processes
restart_pm2_processes() {
    print_header "Restarting PM2 Processes"
    
    # Stop all processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Start with ecosystem configuration
    if [ -f "$PROD_DIR/ecosystem.config.js" ]; then
        print_info "Starting applications with ecosystem configuration..."
        cd "$PROD_DIR"
        pm2 start ecosystem.config.js
        
        # Wait for startup
        sleep 15
        
        # Check status
        print_info "Checking PM2 status..."
        pm2 list
    else
        print_error "Ecosystem configuration file not found"
        return 1
    fi
    
    echo ""
}

# Function to verify everything is working
verify_setup() {
    print_header "Verifying Setup"
    
    # Check Redis
    print_info "Checking Redis..."
    if redis-cli ping | grep -q "PONG"; then
        print_status "Redis is running"
    else
        print_error "Redis is not running"
    fi
    
    # Check PM2 processes
    print_info "Checking PM2 processes..."
    pm2 list
    
    # Check port usage
    print_info "Checking port usage..."
    echo "Port 3000 (Development):"
    lsof -i:3000 2>/dev/null || echo "No process found"
    
    echo "Port 3001 (Production):"
    lsof -i:3001 2>/dev/null || echo "No process found"
    
    # Test Redis connection from Node.js
    print_info "Testing Redis connection from Node.js..."
    node -e "
const redis = require('redis');
const client = redis.createClient('redis://localhost:6379');
client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));
client.ping().then(() => console.log('Redis ping successful')).catch(console.error);
setTimeout(() => process.exit(0), 2000);
" 2>/dev/null || print_warning "Redis Node.js test failed"
    
    echo ""
}

# Function to auto-setup everything
auto_setup_everything() {
    print_header "Auto-Setup Everything"
    
    # Step 1: Check root privileges
    check_root
    
    # Step 2: Install Redis
    install_redis || {
        print_error "Failed to install Redis"
        return 1
    }
    
    # Step 3: Install Redis NPM package
    install_redis_npm || {
        print_error "Failed to install Redis NPM package"
        return 1
    }
    
    # Step 4: Fix build issues
    fix_build_issues || {
        print_error "Failed to fix build issues"
        return 1
    }
    
    # Step 5: Set up environment variables
    setup_environment || {
        print_error "Failed to set up environment variables"
        return 1
    }
    
    # Step 6: Restart PM2 processes
    restart_pm2_processes || {
        print_error "Failed to restart PM2 processes"
        return 1
    }
    
    # Step 7: Verify setup
    verify_setup
    
    print_status "Auto-setup completed successfully"
    echo ""
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Redis Setup and Build Fix Script"
    echo "==================================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Install Redis"
    echo -e "${GREEN}2)${NC} Install Redis NPM Package"
    echo -e "${GREEN}3)${NC} Fix Build Issues"
    echo -e "${GREEN}4)${NC} Setup Environment Variables"
    echo -e "${GREEN}5)${NC} Restart PM2 Processes"
    echo -e "${GREEN}6)${NC} Verify Setup"
    echo -e "${GREEN}7)${NC} Auto-Setup Everything"
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
                install_redis
                read -p "Press Enter to continue..."
                ;;
            2)
                install_redis_npm
                read -p "Press Enter to continue..."
                ;;
            3)
                fix_build_issues
                read -p "Press Enter to continue..."
                ;;
            4)
                setup_environment
                read -p "Press Enter to continue..."
                ;;
            5)
                restart_pm2_processes
                read -p "Press Enter to continue..."
                ;;
            6)
                verify_setup
                read -p "Press Enter to continue..."
                ;;
            7)
                auto_setup_everything
                read -p "Press Enter to continue..."
                ;;
            8)
                print_header "Exiting Redis setup and build fix script"
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