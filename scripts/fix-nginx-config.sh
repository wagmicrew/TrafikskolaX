#!/bin/bash

# 🔧 Nginx Configuration Fix Script
# Fixes common nginx configuration issues including duplicate directives

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="/var/log/nginx-fix.log"
ERROR_LOG="/var/log/nginx-fix-errors.log"

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

# Function to find duplicate directives
find_duplicate_directives() {
    print_header "Searching for Duplicate Directives"
    
    local config_files=(
        "/etc/nginx/nginx.conf"
        "/etc/nginx/sites-enabled/*"
        "/etc/nginx/conf.d/*"
    )
    
    local directives=("gzip" "ssl_protocols" "ssl_ciphers" "add_header" "server_name")
    
    for directive in "${directives[@]}"; do
        print_info "Checking for duplicate '$directive' directives..."
        
        local count=0
        for file in ${config_files[@]}; do
            if [ -f "$file" ]; then
                local file_count=$(grep -c "^[[:space:]]*$directive" "$file" 2>/dev/null || echo "0")
                if [ "$file_count" -gt 1 ]; then
                    print_warning "Found $file_count '$directive' directives in $file"
                    count=$((count + file_count))
                fi
            fi
        done
        
        if [ "$count" -gt 1 ]; then
            print_error "Multiple '$directive' directives found across configuration files"
        else
            print_status "No duplicate '$directive' directives found"
        fi
    done
}

# Function to backup nginx configuration
backup_nginx_config() {
    print_header "Creating Nginx Configuration Backup"
    
    local backup_dir="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [ -d "/etc/nginx" ]; then
        # Copy files individually to avoid recursive copying
        if [ -f "/etc/nginx/nginx.conf" ]; then
            cp /etc/nginx/nginx.conf "$backup_dir/" 2>/dev/null || true
        fi
        if [ -d "/etc/nginx/sites-available" ]; then
            cp -r /etc/nginx/sites-available "$backup_dir/" 2>/dev/null || true
        fi
        if [ -d "/etc/nginx/sites-enabled" ]; then
            cp -r /etc/nginx/sites-enabled "$backup_dir/" 2>/dev/null || true
        fi
        if [ -d "/etc/nginx/conf.d" ]; then
            cp -r /etc/nginx/conf.d "$backup_dir/" 2>/dev/null || true
        fi
        if [ -d "/etc/nginx/modules-enabled" ]; then
            cp -r /etc/nginx/modules-enabled "$backup_dir/" 2>/dev/null || true
        fi
        if [ -f "/etc/nginx/mime.types" ]; then
            cp /etc/nginx/mime.types "$backup_dir/" 2>/dev/null || true
        fi
        
        print_status "Nginx configuration backed up to $backup_dir"
    else
        print_error "Nginx configuration directory not found"
        return 1
    fi
    
    return 0
}

# Function to fix duplicate gzip directives
fix_duplicate_gzip() {
    print_header "Fixing Duplicate Gzip Directives"
    
    local nginx_conf="/etc/nginx/nginx.conf"
    
    if [ ! -f "$nginx_conf" ]; then
        print_error "Nginx configuration file not found"
        return 1
    fi
    
    # Count gzip directives
    local gzip_count=$(grep -c "^[[:space:]]*gzip" "$nginx_conf" 2>/dev/null || echo "0")
    
    if [ "$gzip_count" -gt 1 ]; then
        print_warning "Found $gzip_count gzip directives in $nginx_conf"
    fi
    
    # Create backup
    cp "$nginx_conf" "${nginx_conf}.backup"
    
    # Create a clean, optimized nginx.conf for HTTPS and PM2
    cat > "$nginx_conf" << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

# Load dynamic modules
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 100M;
    
    # Buffer size settings
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeout settings
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    ##
    # Logging Settings
    ##
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    ##
    # Gzip Settings (Optimized for Performance)
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml
        application/x-font-ttf
        font/opentype
        application/vnd.ms-fontobject
        application/x-font-woff;

    ##
    # Security Headers
    ##
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF
        
    print_status "Created optimized nginx.conf for HTTPS and PM2"
    return 0
}

# Function to check and fix sites-enabled
fix_sites_enabled() {
    print_header "Checking Sites-Enabled Configuration"
    
    local sites_enabled="/etc/nginx/sites-enabled"
    local sites_available="/etc/nginx/sites-available"
    
    if [ ! -d "$sites_enabled" ]; then
        print_error "Sites-enabled directory not found"
        return 1
    fi
    
    # Check for broken symlinks
    local broken_links=$(find "$sites_enabled" -type l ! -exec test -e {} \; -print 2>/dev/null)
    
    if [ -n "$broken_links" ]; then
        print_warning "Found broken symlinks in sites-enabled:"
        echo "$broken_links"
        
        for link in $broken_links; do
            print_info "Removing broken symlink: $link"
            rm -f "$link"
        done
    else
        print_status "No broken symlinks found"
    fi
    
    # Check for duplicate server_name directives
    local duplicate_servers=$(grep -r "server_name" "$sites_enabled" 2>/dev/null | awk '{print $2}' | sort | uniq -d)
    
    if [ -n "$duplicate_servers" ]; then
        print_warning "Found duplicate server_name configurations:"
        echo "$duplicate_servers"
    else
        print_status "No duplicate server_name configurations found"
    fi
    
    return 0
}

# Function to create clean nginx configuration
create_clean_nginx_config() {
    print_header "Creating Clean Nginx Configuration"
    
    local nginx_conf="/etc/nginx/nginx.conf"
    
    # Create a clean, optimized nginx.conf for HTTPS and PM2
    cat > "$nginx_conf" << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

# Load dynamic modules
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 100M;
    
    # Buffer size settings
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeout settings
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    ##
    # Logging Settings
    ##
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    ##
    # Gzip Settings (Optimized for Performance)
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml
        application/x-font-ttf
        font/opentype
        application/vnd.ms-fontobject
        application/x-font-woff;

    ##
    # Security Headers
    ##
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF
    
    print_status "Created optimized nginx.conf for HTTPS and PM2"
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
    echo "🔧 Nginx Configuration Fix Script"
    echo "================================="
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Check Nginx Status"
    echo -e "${GREEN}2)${NC} Test Nginx Configuration"
    echo -e "${GREEN}3)${NC} Find Duplicate Directives"
    echo -e "${GREEN}4)${NC} Backup Nginx Configuration"
    echo -e "${GREEN}5)${NC} Fix Duplicate Gzip Directives"
    echo -e "${GREEN}6)${NC} Fix Sites-Enabled Issues"
    echo -e "${GREEN}7)${NC} Create Clean Nginx Configuration"
    echo -e "${GREEN}8)${NC} Restart Nginx Safely"
    echo -e "${GREEN}9)${NC} Auto-Fix All Issues"
    echo -e "${GREEN}10)${NC} Exit"
    echo ""
}

# Function to auto-fix all issues
auto_fix_all() {
    print_header "Auto-Fixing All Nginx Issues"
    
    # Backup configuration
    backup_nginx_config || return 1
    
    # Fix duplicate gzip directives
    fix_duplicate_gzip || return 1
    
    # Fix sites-enabled issues
    fix_sites_enabled || return 1
    
    # Test configuration
    if test_nginx_config; then
        # Restart nginx
        restart_nginx_safely || return 1
        print_status "All nginx issues have been fixed!"
        return 0
    else
        print_error "Configuration test failed after fixes"
        return 1
    fi
}

# Main script execution
main() {
    # Initialize log files
    touch "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
    
    print_header "Starting Nginx Configuration Fix Script"
    print_info "Log file: $LOG_FILE"
    print_info "Error log: $ERROR_LOG"
    
    while true; do
        show_menu
        read -p "Enter your choice (1-10): " choice
        
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
                find_duplicate_directives
                read -p "Press Enter to continue..."
                ;;
            4)
                backup_nginx_config
                read -p "Press Enter to continue..."
                ;;
            5)
                fix_duplicate_gzip
                read -p "Press Enter to continue..."
                ;;
            6)
                fix_sites_enabled
                read -p "Press Enter to continue..."
                ;;
            7)
                create_clean_nginx_config
                read -p "Press Enter to continue..."
                ;;
            8)
                restart_nginx_safely
                read -p "Press Enter to continue..."
                ;;
            9)
                auto_fix_all
                read -p "Press Enter to continue..."
                ;;
            10)
                print_header "Exiting nginx fix script"
                echo ""
                print_info "Nginx fix script completed"
                print_info "Log files available at:"
                print_info "  - $LOG_FILE"
                print_info "  - $ERROR_LOG"
                echo ""
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