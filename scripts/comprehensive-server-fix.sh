#!/bin/bash

# 🔧 Comprehensive Server Fix Script
# Fixes PM2, Nginx, Redis, and domain configuration

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
DEV_DOMAIN="dev.dintrafikskolahlm.se"
PROD_DOMAIN="dintrafikskolahlm.se"
WWW_DOMAIN="www.dintrafikskolahlm.se"

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

# Function to completely stop and clean PM2
clean_pm2_completely() {
    print_header "Completely Cleaning PM2"
    
    # Stop and delete all PM2 processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Kill any remaining Node.js processes
    pkill -f "node" 2>/dev/null || true
    pkill -f "npm" 2>/dev/null || true
    
    # Kill processes on our ports
    sudo kill -9 $(lsof -ti:$DEV_PORT 2>/dev/null) 2>/dev/null || true
    sudo kill -9 $(lsof -ti:$PROD_PORT 2>/dev/null) 2>/dev/null || true
    
    # Clear PM2 logs
    pm2 flush 2>/dev/null || true
    sudo rm -f /var/log/pm2/${PROJECT_NAME}-*.log 2>/dev/null || true
    
    print_status "PM2 completely cleaned"
    echo ""
}

# Function to fix application configurations
fix_app_configurations() {
    print_header "Fixing Application Configurations"
    
    # Fix development configuration
    if [ -d "$DEV_DIR" ]; then
        print_info "Fixing development configuration..."
        cd "$DEV_DIR"
        
        # Create proper .env.local for development
        cat > .env.local << EOF
NODE_ENV=development
PORT=$DEV_PORT
NEXTAUTH_URL=https://$DEV_DOMAIN
NEXT_PUBLIC_APP_URL=https://$DEV_DOMAIN
EOF
        
        print_status "Development configuration fixed"
    else
        print_error "Development directory not found: $DEV_DIR"
        return 1
    fi
    
    # Fix production configuration
    if [ -d "$PROD_DIR" ]; then
        print_info "Fixing production configuration..."
        cd "$PROD_DIR"
        
        # Create proper .env.local for production
        cat > .env.local << EOF
NODE_ENV=production
PORT=$PROD_PORT
NEXTAUTH_URL=https://$PROD_DOMAIN
NEXT_PUBLIC_APP_URL=https://$PROD_DOMAIN
EOF
        
        print_status "Production configuration fixed"
    else
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    echo ""
}

# Function to install and configure Redis
setup_redis() {
    print_header "Setting up Redis Cache"
    
    # Install Redis
    print_info "Installing Redis..."
    apt update
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

# Function to clean up Nginx configuration
cleanup_nginx_config() {
    print_header "Cleaning up Nginx Configuration"
    
    # Backup current configuration
    print_info "Backing up current Nginx configuration..."
    cp -r /etc/nginx/sites-available /etc/nginx/sites-available.backup
    cp -r /etc/nginx/sites-enabled /etc/nginx/sites-enabled.backup
    
    # Remove all existing site configurations
    print_info "Removing existing site configurations..."
    rm -f /etc/nginx/sites-enabled/*
    
    # Create clean development site configuration
    print_info "Creating development site configuration..."
    cat > /etc/nginx/sites-available/$DEV_DOMAIN << EOF
server {
    listen 80;
    server_name $DEV_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DEV_DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DEV_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DEV_DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://127.0.0.1:$DEV_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF
    
    # Create clean production site configuration
    print_info "Creating production site configuration..."
    cat > /etc/nginx/sites-available/$PROD_DOMAIN << EOF
server {
    listen 80;
    server_name $PROD_DOMAIN $WWW_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $PROD_DOMAIN $WWW_DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$PROD_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$PROD_DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    location / {
        proxy_pass http://127.0.0.1:$PROD_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
    
    # Enable the sites
    ln -sf /etc/nginx/sites-available/$DEV_DOMAIN /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/$PROD_DOMAIN /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    if nginx -t; then
        print_status "Nginx configuration is valid"
        systemctl reload nginx
        print_status "Nginx configuration applied"
    else
        print_error "Nginx configuration test failed"
        return 1
    fi
    
    echo ""
}

# Function to obtain SSL certificates
obtain_ssl_certificates() {
    print_header "Obtaining SSL Certificates"
    
    # Install certbot if not installed
    if ! command -v certbot &> /dev/null; then
        print_info "Installing certbot..."
        apt install -y certbot python3-certbot-nginx
    fi
    
    # Obtain certificate for development domain
    print_info "Obtaining certificate for $DEV_DOMAIN..."
    certbot --nginx -d $DEV_DOMAIN --non-interactive --agree-tos --email admin@dintrafikskolahlm.se || {
        print_warning "Failed to obtain certificate for $DEV_DOMAIN"
    }
    
    # Obtain certificate for production domains
    print_info "Obtaining certificate for $PROD_DOMAIN and $WWW_DOMAIN..."
    certbot --nginx -d $PROD_DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@dintrafikskolahlm.se || {
        print_warning "Failed to obtain certificate for production domains"
    }
    
    print_status "SSL certificates obtained"
    echo ""
}

# Function to start PM2 processes correctly
start_pm2_processes() {
    print_header "Starting PM2 Processes Correctly"
    
    # Start development process
    print_info "Starting development process on port $DEV_PORT..."
    cd "$DEV_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing development dependencies..."
        npm install
    fi
    
    pm2 start npm --name "${PROJECT_NAME}-dev" -- run dev
    
    sleep 5
    
    # Start production process
    print_info "Starting production process on port $PROD_PORT..."
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
    
    pm2 start npm --name "${PROJECT_NAME}-prod" -- start
    
    sleep 10
    
    # Check final status
    print_header "Final PM2 Status"
    pm2 list
    
    echo ""
}

# Function to verify everything is working
verify_setup() {
    print_header "Verifying Setup"
    
    # Check PM2 processes
    print_info "Checking PM2 processes..."
    pm2 list
    
    # Check port usage
    print_info "Checking port usage..."
    echo "Port $DEV_PORT (Development):"
    lsof -i:$DEV_PORT 2>/dev/null || echo "No process found"
    
    echo "Port $PROD_PORT (Production):"
    lsof -i:$PROD_PORT 2>/dev/null || echo "No process found"
    
    # Check Redis
    print_info "Checking Redis..."
    if redis-cli ping | grep -q "PONG"; then
        print_status "Redis is running"
    else
        print_error "Redis is not running"
    fi
    
    # Check Nginx
    print_info "Checking Nginx..."
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_error "Nginx is not running"
    fi
    
    # Check SSL certificates
    print_info "Checking SSL certificates..."
    if [ -f "/etc/letsencrypt/live/$DEV_DOMAIN/fullchain.pem" ]; then
        print_status "Development SSL certificate exists"
    else
        print_warning "Development SSL certificate missing"
    fi
    
    if [ -f "/etc/letsencrypt/live/$PROD_DOMAIN/fullchain.pem" ]; then
        print_status "Production SSL certificate exists"
    else
        print_warning "Production SSL certificate missing"
    fi
    
    echo ""
}

# Function to auto-fix everything
auto_fix_everything() {
    print_header "Auto-Fixing Everything"
    
    # Step 1: Check root privileges
    check_root
    
    # Step 2: Clean PM2 completely
    clean_pm2_completely
    
    # Step 3: Fix application configurations
    fix_app_configurations || {
        print_error "Failed to fix application configurations"
        return 1
    }
    
    # Step 4: Setup Redis
    setup_redis || {
        print_error "Failed to setup Redis"
        return 1
    }
    
    # Step 5: Cleanup Nginx configuration
    cleanup_nginx_config || {
        print_error "Failed to cleanup Nginx configuration"
        return 1
    }
    
    # Step 6: Obtain SSL certificates
    obtain_ssl_certificates
    
    # Step 7: Start PM2 processes
    start_pm2_processes || {
        print_error "Failed to start PM2 processes"
        return 1
    }
    
    # Step 8: Verify setup
    verify_setup
    
    print_status "Comprehensive server fix completed"
    echo ""
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Comprehensive Server Fix Script"
    echo "================================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Clean PM2 Completely"
    echo -e "${GREEN}2)${NC} Fix Application Configurations"
    echo -e "${GREEN}3)${NC} Setup Redis Cache"
    echo -e "${GREEN}4)${NC} Cleanup Nginx Configuration"
    echo -e "${GREEN}5)${NC} Obtain SSL Certificates"
    echo -e "${GREEN}6)${NC} Start PM2 Processes"
    echo -e "${GREEN}7)${NC} Verify Setup"
    echo -e "${GREEN}8)${NC} Auto-Fix Everything"
    echo -e "${GREEN}9)${NC} Exit"
    echo ""
}

# Main script execution
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-9): " choice
        
        case $choice in
            1)
                clean_pm2_completely
                read -p "Press Enter to continue..."
                ;;
            2)
                fix_app_configurations
                read -p "Press Enter to continue..."
                ;;
            3)
                setup_redis
                read -p "Press Enter to continue..."
                ;;
            4)
                cleanup_nginx_config
                read -p "Press Enter to continue..."
                ;;
            5)
                obtain_ssl_certificates
                read -p "Press Enter to continue..."
                ;;
            6)
                start_pm2_processes
                read -p "Press Enter to continue..."
                ;;
            7)
                verify_setup
                read -p "Press Enter to continue..."
                ;;
            8)
                auto_fix_everything
                read -p "Press Enter to continue..."
                ;;
            9)
                print_header "Exiting comprehensive server fix script"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-9."
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Run main function
main "$@" 