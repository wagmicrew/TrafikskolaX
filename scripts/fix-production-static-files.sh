#!/bin/bash

# 🔧 Production Static Files Fix Script
# Fixes 404 errors for CSS, JS, and image files in production

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
PROD_DIR="/var/www/dintrafikskolax_prod"
DEV_DIR="/var/www/dintrafikskolax_dev"
PROD_PORT=3001
DEV_PORT=3000

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

# Function to check production build
check_production_build() {
    print_header "Checking Production Build"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    cd "$PROD_DIR"
    
    # Check if .next directory exists
    if [ ! -d ".next" ]; then
        print_warning ".next directory not found - build is missing"
        return 1
    fi
    
    # Check static files
    print_info "Checking static files..."
    if [ -d ".next/static" ]; then
        print_status "Static files directory exists"
        ls -la .next/static/ 2>/dev/null | head -10
    else
        print_error "Static files directory missing"
        return 1
    fi
    
    # Check if build is complete
    if [ -f ".next/BUILD_ID" ]; then
        print_status "Build ID exists - build appears complete"
    else
        print_warning "Build ID missing - build may be incomplete"
    fi
    
    echo ""
}

# Function to rebuild production
rebuild_production() {
    print_header "Rebuilding Production"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    cd "$PROD_DIR"
    
    # Clear everything
    print_info "Clearing build cache..."
    rm -rf .next
    rm -rf node_modules/.cache
    rm -rf .swc
    
    # Reinstall dependencies
    print_info "Reinstalling dependencies..."
    npm install
    
    # Build production
    print_info "Building production application..."
    npm run build
    
    # Check if build was successful
    if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
        print_status "Production build completed successfully"
        return 0
    else
        print_error "Production build failed"
        return 1
    fi
    
    echo ""
}

# Function to check file permissions
check_file_permissions() {
    print_header "Checking File Permissions"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    cd "$PROD_DIR"
    
    # Check ownership
    print_info "Checking file ownership..."
    ls -la .next/ 2>/dev/null | head -5
    
    # Check permissions
    print_info "Checking file permissions..."
    find .next -type f -exec ls -la {} \; 2>/dev/null | head -5
    
    # Fix permissions if needed
    print_info "Fixing file permissions..."
    chown -R www-data:www-data .next/ 2>/dev/null || true
    chmod -R 755 .next/ 2>/dev/null || true
    
    print_status "File permissions checked and fixed"
    echo ""
}

# Function to check Nginx configuration
check_nginx_config() {
    print_header "Checking Nginx Configuration"
    
    # Check if Nginx is running
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_error "Nginx is not running"
        return 1
    fi
    
    # Check Nginx configuration
    if nginx -t; then
        print_status "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors"
        return 1
    fi
    
    # Check site configuration
    print_info "Checking site configuration..."
    if [ -f "/etc/nginx/sites-enabled/dintrafikskolahlm.se" ]; then
        print_status "Site configuration exists"
        cat /etc/nginx/sites-enabled/dintrafikskolahlm.se | grep -A 10 -B 5 "location /"
    else
        print_error "Site configuration missing"
        return 1
    fi
    
    echo ""
}

# Function to fix Nginx static file serving
fix_nginx_static_files() {
    print_header "Fixing Nginx Static File Serving"
    
    # Backup current configuration
    print_info "Backing up current Nginx configuration..."
    cp /etc/nginx/sites-enabled/dintrafikskolahlm.se /etc/nginx/sites-enabled/dintrafikskolahlm.se.backup
    
    # Create improved configuration
    print_info "Creating improved Nginx configuration..."
    cat > /etc/nginx/sites-enabled/dintrafikskolahlm.se << 'EOF'
server {
    listen 80;
    server_name dintrafikskolahlm.se www.dintrafikskolahlm.se;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dintrafikskolahlm.se www.dintrafikskolahlm.se;
    
    ssl_certificate /etc/letsencrypt/live/dintrafikskolahlm.se/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dintrafikskolahlm.se/privkey.pem;
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
    
    # Serve static files directly
    location /_next/static/ {
        alias /var/www/dintrafikskolax_prod/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # Serve public files
    location /images/ {
        alias /var/www/dintrafikskolax_prod/public/images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /manifest.json {
        alias /var/www/dintrafikskolax_prod/public/manifest.json;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    location /favicon.ico {
        alias /var/www/dintrafikskolax_prod/public/favicon.ico;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Next.js application
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # Handle Next.js static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
    
    # Test configuration
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

# Function to check if files exist
check_static_files_exist() {
    print_header "Checking Static Files Exist"
    
    if [ ! -d "$PROD_DIR" ]; then
        print_error "Production directory not found: $PROD_DIR"
        return 1
    fi
    
    cd "$PROD_DIR"
    
    # Check Next.js static files
    print_info "Checking Next.js static files..."
    if [ -d ".next/static" ]; then
        print_status "Next.js static directory exists"
        ls -la .next/static/ 2>/dev/null | head -5
    else
        print_error "Next.js static directory missing"
    fi
    
    # Check public files
    print_info "Checking public files..."
    if [ -d "public/images" ]; then
        print_status "Public images directory exists"
        ls -la public/images/ 2>/dev/null | head -5
    else
        print_warning "Public images directory missing"
    fi
    
    # Check manifest.json
    if [ -f "public/manifest.json" ]; then
        print_status "manifest.json exists"
    else
        print_warning "manifest.json missing"
    fi
    
    echo ""
}

# Function to test static file serving
test_static_file_serving() {
    print_header "Testing Static File Serving"
    
    # Test local file access
    print_info "Testing local file access..."
    if [ -f "/var/www/dintrafikskolax_prod/.next/static/css/app.css" ]; then
        print_status "CSS file exists locally"
    else
        print_warning "CSS file not found locally"
    fi
    
    # Test HTTP access
    print_info "Testing HTTP access to static files..."
    curl -I https://dintrafikskolahlm.se/_next/static/css/app.css 2>/dev/null | head -5 || print_warning "HTTP access test failed"
    
    # Test image access
    print_info "Testing image access..."
    curl -I https://dintrafikskolahlm.se/images/din-logo.png 2>/dev/null | head -5 || print_warning "Image access test failed"
    
    echo ""
}

# Function to restart everything
restart_everything() {
    print_header "Restarting Everything"
    
    # Restart Nginx
    print_info "Restarting Nginx..."
    systemctl restart nginx
    
    # Restart PM2 processes
    print_info "Restarting PM2 processes..."
    pm2 restart all
    
    # Wait for startup
    sleep 10
    
    # Check status
    print_info "Checking services status..."
    systemctl status nginx --no-pager -l
    pm2 list
    
    echo ""
}

# Function to auto-fix everything
auto_fix_static_files() {
    print_header "Auto-Fixing Static File Issues"
    
    # Step 1: Check root privileges
    check_root
    
    # Step 2: Check production build
    check_production_build || {
        print_error "Production build check failed"
        return 1
    }
    
    # Step 3: Rebuild production if needed
    if [ ! -d "$PROD_DIR/.next" ]; then
        rebuild_production || {
            print_error "Failed to rebuild production"
            return 1
        }
    fi
    
    # Step 4: Check file permissions
    check_file_permissions || {
        print_error "Failed to check file permissions"
        return 1
    }
    
    # Step 5: Check Nginx configuration
    check_nginx_config || {
        print_error "Nginx configuration check failed"
        return 1
    }
    
    # Step 6: Fix Nginx static file serving
    fix_nginx_static_files || {
        print_error "Failed to fix Nginx static file serving"
        return 1
    }
    
    # Step 7: Check static files exist
    check_static_files_exist || {
        print_error "Static files check failed"
        return 1
    }
    
    # Step 8: Restart everything
    restart_everything || {
        print_error "Failed to restart services"
        return 1
    }
    
    # Step 9: Test static file serving
    test_static_file_serving || {
        print_warning "Static file serving test failed"
    }
    
    print_status "Static file fix completed"
    echo ""
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Production Static Files Fix Script"
    echo "====================================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Check Production Build"
    echo -e "${GREEN}2)${NC} Rebuild Production"
    echo -e "${GREEN}3)${NC} Check File Permissions"
    echo -e "${GREEN}4)${NC} Check Nginx Configuration"
    echo -e "${GREEN}5)${NC} Fix Nginx Static File Serving"
    echo -e "${GREEN}6)${NC} Check Static Files Exist"
    echo -e "${GREEN}7)${NC} Test Static File Serving"
    echo -e "${GREEN}8)${NC} Restart Everything"
    echo -e "${GREEN}9)${NC} Auto-Fix Everything"
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
                check_production_build
                read -p "Press Enter to continue..."
                ;;
            2)
                rebuild_production
                read -p "Press Enter to continue..."
                ;;
            3)
                check_file_permissions
                read -p "Press Enter to continue..."
                ;;
            4)
                check_nginx_config
                read -p "Press Enter to continue..."
                ;;
            5)
                fix_nginx_static_files
                read -p "Press Enter to continue..."
                ;;
            6)
                check_static_files_exist
                read -p "Press Enter to continue..."
                ;;
            7)
                test_static_file_serving
                read -p "Press Enter to continue..."
                ;;
            8)
                restart_everything
                read -p "Press Enter to continue..."
                ;;
            9)
                auto_fix_static_files
                read -p "Press Enter to continue..."
                ;;
            10)
                print_header "Exiting static files fix script"
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