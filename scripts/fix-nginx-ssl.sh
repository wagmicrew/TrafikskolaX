#!/bin/bash

# 🔧 Nginx SSL Certificate Fix Script
# Fixes nginx SSL certificate loading issues

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="dintrafikskolahlm.se"
WWW_DOMAIN="www.dintrafikskolahlm.se"
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

# Log file
LOG_FILE="/var/log/nginx-ssl-fix.log"
ERROR_LOG="/var/log/nginx-ssl-fix-errors.log"

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

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check if directory exists
directory_exists() {
    [ -d "$1" ]
}

# Function to check nginx status
check_nginx_status() {
    print_header "Checking Nginx Status"
    
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
        return 0
    else
        print_error "Nginx is not running"
        return 1
    fi
}

# Function to test nginx configuration
test_nginx_config() {
    print_header "Testing Nginx Configuration"
    
    if nginx -t; then
        print_status "Nginx configuration is valid"
        return 0
    else
        print_error "Nginx configuration has errors"
        return 1
    fi
}

# Function to check SSL certificates
check_ssl_certificates() {
    print_header "Checking SSL Certificates"
    
    local cert_dir="/etc/letsencrypt/live/$DOMAIN"
    local cert_file="$cert_dir/fullchain.pem"
    local key_file="$cert_dir/privkey.pem"
    
    if directory_exists "$cert_dir"; then
        print_status "SSL certificate directory exists"
        
        if file_exists "$cert_file"; then
            print_status "SSL certificate file exists"
        else
            print_error "SSL certificate file missing: $cert_file"
            return 1
        fi
        
        if file_exists "$key_file"; then
            print_status "SSL private key file exists"
        else
            print_error "SSL private key file missing: $key_file"
            return 1
        fi
    else
        print_error "SSL certificate directory missing: $cert_dir"
        return 1
    fi
    
    return 0
}

# Function to backup current nginx configuration
backup_nginx_config() {
    print_header "Backing Up Current Nginx Configuration"
    
    local backup_dir="/tmp/nginx-ssl-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [ -d "/etc/nginx" ]; then
        cp /etc/nginx/nginx.conf "$backup_dir/" 2>/dev/null || true
        cp -r /etc/nginx/sites-available "$backup_dir/" 2>/dev/null || true
        cp -r /etc/nginx/sites-enabled "$backup_dir/" 2>/dev/null || true
        
        print_status "Nginx configuration backed up to $backup_dir"
    else
        print_error "Nginx configuration directory not found"
        return 1
    fi
    
    return 0
}

# Function to create HTTP-only nginx configuration
create_http_only_config() {
    print_header "Creating HTTP-Only Nginx Configuration"
    
    local nginx_config="$NGINX_SITES_DIR/$DOMAIN"
    
    # Create HTTP-only configuration (no SSL)
    cat > "$nginx_config" << EOF
# HTTP - temporary configuration without SSL
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    # Proxy to PM2 applications
    location / {
        proxy_pass http://localhost:3001;  # Production port
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
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Logging
    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;
}
EOF
    
    # Enable the site
    ln -sf "$nginx_config" "$NGINX_ENABLED_DIR/"
    
    # Test nginx configuration
    if nginx -t; then
        print_status "HTTP-only nginx configuration created successfully"
        systemctl reload nginx
    else
        print_error "HTTP-only nginx configuration test failed"
        return 1
    fi
    
    return 0
}

# Function to create SSL-enabled nginx configuration
create_ssl_config() {
    print_header "Creating SSL-Enabled Nginx Configuration"
    
    # Check if certificates exist
    if ! check_ssl_certificates; then
        print_error "SSL certificates not found. Cannot create SSL configuration."
        print_info "Please run the SSL configuration script first to obtain certificates."
        return 1
    fi
    
    local nginx_config="$NGINX_SITES_DIR/$DOMAIN"
    
    # Create SSL-enabled configuration
    cat > "$nginx_config" << EOF
# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS - main configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to PM2 applications
    location / {
        proxy_pass http://localhost:3001;  # Production port
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
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Logging
    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;
}
EOF
    
    # Enable the site
    ln -sf "$nginx_config" "$NGINX_ENABLED_DIR/"
    
    # Test nginx configuration
    if nginx -t; then
        print_status "SSL-enabled nginx configuration created successfully"
        systemctl reload nginx
    else
        print_error "SSL-enabled nginx configuration test failed"
        return 1
    fi
    
    return 0
}

# Function to restart nginx safely
restart_nginx_safely() {
    print_header "Restarting Nginx Safely"
    
    # Stop nginx
    print_info "Stopping nginx..."
    systemctl stop nginx
    
    # Wait a moment
    sleep 2
    
    # Test configuration
    if nginx -t; then
        print_status "Configuration test passed"
        
        # Start nginx
        print_info "Starting nginx..."
        if systemctl start nginx; then
            print_status "Nginx started successfully"
            
            # Check if it's running
            if systemctl is-active --quiet nginx; then
                print_status "Nginx is running"
                return 0
            else
                print_error "Nginx failed to start"
                return 1
            fi
        else
            print_error "Failed to start nginx"
            return 1
        fi
    else
        print_error "Configuration test failed, nginx not started"
        return 1
    fi
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🔧 Nginx SSL Certificate Fix Script"
    echo "==================================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Check Nginx Status"
    echo -e "${GREEN}2)${NC} Test Nginx Configuration"
    echo -e "${GREEN}3)${NC} Check SSL Certificates"
    echo -e "${GREEN}4)${NC} Backup Nginx Configuration"
    echo -e "${GREEN}5)${NC} Create HTTP-Only Configuration"
    echo -e "${GREEN}6)${NC} Create SSL-Enabled Configuration"
    echo -e "${GREEN}7)${NC} Restart Nginx Safely"
    echo -e "${GREEN}8)${NC} Auto-Fix SSL Issues"
    echo -e "${GREEN}9)${NC} Exit"
    echo ""
    echo -e "${YELLOW}Domain: $DOMAIN${NC}"
    echo -e "${YELLOW}WWW Domain: $WWW_DOMAIN${NC}"
    echo ""
}

# Function to auto-fix SSL issues
auto_fix_ssl_issues() {
    print_header "Auto-Fixing SSL Issues"
    
    # Backup current configuration
    backup_nginx_config || return 1
    
    # Check if SSL certificates exist
    if check_ssl_certificates; then
        print_info "SSL certificates found, creating SSL-enabled configuration"
        create_ssl_config || return 1
    else
        print_warning "SSL certificates not found, creating HTTP-only configuration"
        print_info "You can run the SSL configuration script later to add HTTPS"
        create_http_only_config || return 1
    fi
    
    # Restart nginx safely
    restart_nginx_safely || return 1
    
    print_status "SSL issues have been fixed!"
    return 0
}

# Main script execution
main() {
    # Initialize log files
    touch "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
    
    print_header "Starting Nginx SSL Certificate Fix Script"
    print_info "Log file: $LOG_FILE"
    print_info "Error log: $ERROR_LOG"
    
    while true; do
        show_menu
        read -p "Enter your choice (1-9): " choice
        
        case $choice in
            1)
                check_nginx_status
                read -p "Press Enter to continue..."
                ;;
            2)
                test_nginx_config
                read -p "Press Enter to continue..."
                ;;
            3)
                check_ssl_certificates
                read -p "Press Enter to continue..."
                ;;
            4)
                backup_nginx_config
                read -p "Press Enter to continue..."
                ;;
            5)
                create_http_only_config
                read -p "Press Enter to continue..."
                ;;
            6)
                create_ssl_config
                read -p "Press Enter to continue..."
                ;;
            7)
                restart_nginx_safely
                read -p "Press Enter to continue..."
                ;;
            8)
                auto_fix_ssl_issues
                read -p "Press Enter to continue..."
                ;;
            9)
                print_header "Exiting nginx SSL fix script"
                echo ""
                print_info "Nginx SSL fix script completed"
                print_info "Log files available at:"
                print_info "  - $LOG_FILE"
                print_info "  - $ERROR_LOG"
                echo ""
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