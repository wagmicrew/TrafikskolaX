#!/bin/bash

# 🛡️ SSL Certificate Configuration Script for Din Trafikskola Hässleholm
# Configures SSL certificates for dintrafikskolahlm.se and www.dintrafikskolahlm.se
# Uses Let's Encrypt via Certbot for free SSL certificates

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="dintrafikskolahlm.se"
WWW_DOMAIN="www.dintrafikskolahlm.se"
EMAIL="admin@dintrafikskolahlm.se"
PROJECT_NAME="dintrafikskolax"
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

# Log file
LOG_FILE="/var/log/ssl-configuration.log"
ERROR_LOG="/var/log/ssl-configuration-errors.log"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check if directory exists
directory_exists() {
    [ -d "$1" ]
}

# Function to check system requirements
check_requirements() {
    print_header "Checking system requirements..."
    
    local requirements_met=true
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root or with sudo privileges"
        requirements_met=false
    fi
    
    # Check if certbot is installed
    if ! command_exists certbot; then
        print_error "Certbot is not installed. Please install it first:"
        print_info "sudo apt update && sudo apt install -y certbot python3-certbot-nginx"
        requirements_met=false
    else
        print_status "Certbot is installed"
    fi
    
    # Check if nginx is installed
    if ! command_exists nginx; then
        print_error "Nginx is not installed. Please install it first:"
        print_info "sudo apt update && sudo apt install -y nginx"
        requirements_met=false
    else
        print_status "Nginx is installed"
    fi
    
    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        print_error "Nginx is not running. Please start it first:"
        print_info "sudo systemctl start nginx"
        requirements_met=false
    else
        print_status "Nginx is running"
    fi
    
    # Check internet connectivity
    if ! ping -c 1 google.com >/dev/null 2>&1; then
        print_error "No internet connectivity detected"
        requirements_met=false
    else
        print_status "Internet connectivity confirmed"
    fi
    
    if [ "$requirements_met" = false ]; then
        print_error "System requirements not met. Please fix the issues above and try again."
        return 1
    fi
    
    print_status "All system requirements met"
    return 0
}

# Function to check DNS resolution
check_dns() {
    print_header "Checking DNS resolution..."
    
    local domains=("$DOMAIN" "$WWW_DOMAIN")
    local all_resolved=true
    
    for domain in "${domains[@]}"; do
        print_info "Checking DNS for $domain..."
        
        # Get server IP
        local server_ip=$(hostname -I | awk '{print $1}')
        
        # Check if domain resolves to this server
        local resolved_ip=$(dig +short "$domain" | head -1)
        
        if [ -n "$resolved_ip" ]; then
            print_info "$domain resolves to $resolved_ip"
            if [ "$resolved_ip" = "$server_ip" ]; then
                print_status "$domain is correctly pointing to this server"
            else
                print_warning "$domain points to $resolved_ip, but this server is $server_ip"
                print_warning "Make sure DNS is configured correctly for SSL verification"
            fi
        else
            print_error "$domain does not resolve to any IP address"
            all_resolved=false
            
            # Provide helpful information for www subdomain
            if [ "$domain" = "$WWW_DOMAIN" ]; then
                print_info "To set up www subdomain, add this DNS record:"
                print_info "Type: CNAME"
                print_info "Name: www"
                print_info "Value: $DOMAIN"
                print_info "Or alternatively:"
                print_info "Type: A"
                print_info "Name: www"
                print_info "Value: $server_ip"
            fi
        fi
    done
    
    if [ "$all_resolved" = false ]; then
        print_warning "Some domains may not be properly configured in DNS"
        print_warning "SSL certificate issuance may fail if DNS is not correct"
        echo ""
        print_info "DNS Setup Instructions:"
        print_info "1. Log into your domain registrar's DNS management"
        print_info "2. Add these records:"
        print_info "   - A record: $DOMAIN -> $server_ip"
        print_info "   - CNAME record: www -> $DOMAIN"
        print_info "   OR A record: www -> $server_ip"
        print_info "3. Wait for DNS propagation (can take up to 24 hours)"
        echo ""
        read -p "Continue anyway? (y/N): " continue_anyway
        if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    return 0
}

# Function to setup www subdomain
setup_www_subdomain() {
    print_header "Setting up www subdomain..."
    
    print_info "This will help you configure the www subdomain"
    print_info "Current server IP: $(hostname -I | awk '{print $1}')"
    print_info "Main domain: $DOMAIN"
    print_info "WWW subdomain: $WWW_DOMAIN"
    echo ""
    
    print_info "DNS Configuration Instructions:"
    echo ""
    print_info "Option 1 - CNAME Record (Recommended):"
    print_info "  Type: CNAME"
    print_info "  Name: www"
    print_info "  Value: $DOMAIN"
    print_info "  TTL: 3600 (or default)"
    echo ""
    print_info "Option 2 - A Record:"
    print_info "  Type: A"
    print_info "  Name: www"
    print_info "  Value: $(hostname -I | awk '{print $1}')"
    print_info "  TTL: 3600 (or default)"
    echo ""
    print_info "After adding the DNS record:"
    print_info "1. Wait 5-10 minutes for DNS propagation"
    print_info "2. Test with: dig +short $WWW_DOMAIN"
    print_info "3. Run this script again to configure SSL"
    echo ""
    
    read -p "Press Enter when you've added the DNS record..."
    
    # Test DNS resolution
    print_info "Testing DNS resolution..."
    local resolved_ip=$(dig +short "$WWW_DOMAIN" | head -1)
    
    if [ -n "$resolved_ip" ]; then
        print_status "$WWW_DOMAIN now resolves to $resolved_ip"
        local server_ip=$(hostname -I | awk '{print $1}')
        if [ "$resolved_ip" = "$server_ip" ] || [ "$resolved_ip" = "$DOMAIN" ]; then
            print_status "WWW subdomain is correctly configured!"
        else
            print_warning "WWW subdomain points to $resolved_ip"
            print_warning "Make sure it points to this server ($server_ip) or the main domain"
        fi
    else
        print_error "$WWW_DOMAIN still does not resolve"
        print_info "DNS propagation may take longer. Try again in a few minutes."
    fi
    
    return 0
}

# Function to create nginx configuration
create_nginx_config() {
    print_header "Creating Nginx configuration..."
    
    local nginx_config="$NGINX_SITES_DIR/$DOMAIN"
    
    # Create nginx configuration
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
    
    # SSL configuration (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
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
        print_status "Nginx configuration created and tested successfully"
        systemctl reload nginx
    else
        print_error "Nginx configuration test failed"
        return 1
    fi
    
    return 0
}

# Function to obtain SSL certificates
obtain_ssl_certificates() {
    print_header "Obtaining SSL certificates..."
    
    local cert_type="$1"  # "individual" or "wildcard"
    
    if [ "$cert_type" = "wildcard" ]; then
        print_info "Obtaining wildcard certificate for *.$DOMAIN"
        
        # Wildcard certificates require DNS challenge
        certbot certonly \
            --manual \
            --preferred-challenges=dns \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            -d "*.$DOMAIN" \
            --config-dir /etc/letsencrypt \
            --logs-dir /var/log/letsencrypt \
            --work-dir /var/lib/letsencrypt
        
        if [ $? -eq 0 ]; then
            print_status "Wildcard certificate obtained successfully"
        else
            print_error "Failed to obtain wildcard certificate"
            return 1
        fi
    else
        print_info "Obtaining individual certificates for $DOMAIN and $WWW_DOMAIN"
        
        # Individual certificates using nginx plugin
        certbot certonly \
            --nginx \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            -d "$WWW_DOMAIN" \
            --config-dir /etc/letsencrypt \
            --logs-dir /var/log/letsencrypt \
            --work-dir /var/lib/letsencrypt
        
        if [ $? -eq 0 ]; then
            print_status "Individual certificates obtained successfully"
        else
            print_error "Failed to obtain individual certificates"
            return 1
        fi
    fi
    
    return 0
}

# Function to configure SSL in nginx
configure_ssl_in_nginx() {
    print_header "Configuring SSL in Nginx..."
    
    local nginx_config="$NGINX_SITES_DIR/$DOMAIN"
    
    # Update nginx configuration with SSL settings
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
    
    # Test and reload nginx
    if nginx -t; then
        print_status "SSL configuration applied successfully"
        systemctl reload nginx
    else
        print_error "SSL configuration test failed"
        return 1
    fi
    
    return 0
}

# Function to setup auto-renewal
setup_auto_renewal() {
    print_header "Setting up automatic certificate renewal..."
    
    # Create renewal script
    local renewal_script="/usr/local/bin/renew-ssl-certificates.sh"
    
    cat > "$renewal_script" << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script
# This script renews SSL certificates and reloads nginx

echo "$(date): Starting SSL certificate renewal..."

# Renew certificates
certbot renew --quiet --no-self-upgrade

# Check if renewal was successful
if [ $? -eq 0 ]; then
    echo "$(date): Certificates renewed successfully"
    
    # Reload nginx to use new certificates
    nginx -t && systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "$(date): Nginx reloaded successfully"
    else
        echo "$(date): ERROR - Failed to reload nginx"
        exit 1
    fi
else
    echo "$(date): ERROR - Certificate renewal failed"
    exit 1
fi
EOF
    
    # Make script executable
    chmod +x "$renewal_script"
    
    # Add to crontab for automatic renewal
    local cron_job="0 12 * * * $renewal_script >> /var/log/ssl-renewal.log 2>&1"
    
    # Check if cron job already exists
    if ! crontab -l 2>/dev/null | grep -q "renew-ssl-certificates.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        print_status "Auto-renewal cron job added"
    else
        print_info "Auto-renewal cron job already exists"
    fi
    
    print_status "Automatic certificate renewal configured"
    return 0
}

# Function to test SSL configuration
test_ssl_configuration() {
    print_header "Testing SSL configuration..."
    
    local domains=("$DOMAIN" "$WWW_DOMAIN")
    local all_tests_passed=true
    
    for domain in "${domains[@]}"; do
        print_info "Testing SSL for $domain..."
        
        # Test HTTPS response
        local https_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>/dev/null)
        
        if [ "$https_response" = "200" ] || [ "$https_response" = "301" ] || [ "$https_response" = "302" ]; then
            print_status "$domain HTTPS is working (HTTP $https_response)"
        else
            print_error "$domain HTTPS test failed (HTTP $https_response)"
            all_tests_passed=false
        fi
        
        # Test certificate validity
        local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ -n "$cert_info" ]; then
            print_status "$domain SSL certificate is valid"
        else
            print_error "$domain SSL certificate test failed"
            all_tests_passed=false
        fi
    done
    
    if [ "$all_tests_passed" = true ]; then
        print_status "All SSL tests passed"
    else
        print_warning "Some SSL tests failed"
    fi
    
    return 0
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    echo "🛡️  SSL Certificate Configuration Script"
    echo "========================================"
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Configure Individual Certificates (Recommended)"
    echo -e "${GREEN}2)${NC} Configure Wildcard Certificate (Advanced)"
    echo -e "${GREEN}3)${NC} Check SSL Status"
    echo -e "${GREEN}4)${NC} Renew Certificates"
    echo -e "${GREEN}5)${NC} Test SSL Configuration"
    echo -e "${GREEN}6)${NC} View SSL Logs"
    echo -e "${GREEN}7)${NC} Setup WWW Subdomain"
    echo -e "${GREEN}8)${NC} Exit"
    echo ""
    echo -e "${YELLOW}Domains: $DOMAIN, $WWW_DOMAIN${NC}"
    echo -e "${YELLOW}Email: $EMAIL${NC}"
    echo ""
}

# Function to configure individual certificates
configure_individual_certificates() {
    print_header "Configuring Individual SSL Certificates"
    
    # Check requirements
    check_requirements || return 1
    
    # Check DNS
    check_dns || return 1
    
    # Create nginx configuration
    create_nginx_config || return 1
    
    # Obtain certificates
    obtain_ssl_certificates "individual" || return 1
    
    # Configure SSL in nginx
    configure_ssl_in_nginx || return 1
    
    # Setup auto-renewal
    setup_auto_renewal || return 1
    
    # Test configuration
    test_ssl_configuration || return 1
    
    print_status "Individual SSL certificates configured successfully!"
    print_info "Your domains are now accessible via HTTPS:"
    print_info "  - https://$DOMAIN"
    print_info "  - https://$WWW_DOMAIN"
    
    return 0
}

# Function to configure wildcard certificate
configure_wildcard_certificate() {
    print_header "Configuring Wildcard SSL Certificate"
    
    print_warning "Wildcard certificates require DNS challenge verification"
    print_warning "You will need to add TXT records to your DNS"
    print_warning "This is more complex but covers all subdomains"
    echo ""
    
    read -p "Do you want to continue with wildcard certificate? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "Wildcard certificate configuration cancelled"
        return 0
    fi
    
    # Check requirements
    check_requirements || return 1
    
    # Check DNS
    check_dns || return 1
    
    # Create nginx configuration
    create_nginx_config || return 1
    
    # Obtain certificates
    obtain_ssl_certificates "wildcard" || return 1
    
    # Configure SSL in nginx
    configure_ssl_in_nginx || return 1
    
    # Setup auto-renewal
    setup_auto_renewal || return 1
    
    # Test configuration
    test_ssl_configuration || return 1
    
    print_status "Wildcard SSL certificate configured successfully!"
    print_info "Your domain and all subdomains are now accessible via HTTPS"
    
    return 0
}

# Function to check SSL status
check_ssl_status() {
    print_header "Checking SSL Certificate Status"
    
    local domains=("$DOMAIN" "$WWW_DOMAIN")
    
    for domain in "${domains[@]}"; do
        print_info "Checking $domain..."
        
        # Check certificate expiration
        local cert_expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [ -n "$cert_expiry" ]; then
            print_status "$domain certificate expires: $cert_expiry"
        else
            print_error "$domain certificate not found or invalid"
        fi
        
        # Check certificate subject
        local cert_subject=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)
        
        if [ -n "$cert_subject" ]; then
            print_info "$domain certificate subject: $cert_subject"
        fi
    done
    
    return 0
}

# Function to renew certificates
renew_certificates() {
    print_header "Renewing SSL Certificates"
    
    certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        print_status "Certificate renewal test successful"
        print_info "Certificates will be renewed automatically"
    else
        print_error "Certificate renewal test failed"
        return 1
    fi
    
    return 0
}

# Function to view SSL logs
view_ssl_logs() {
    print_header "SSL Configuration Logs"
    echo ""
    echo -e "${CYAN}Recent SSL configuration logs:${NC}"
    tail -20 "$LOG_FILE" 2>/dev/null || echo "No logs found"
    echo ""
    echo -e "${CYAN}Recent SSL errors:${NC}"
    tail -20 "$ERROR_LOG" 2>/dev/null || echo "No errors found"
    echo ""
}

# Main script execution
main() {
    # Initialize log files
    touch "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
    
    print_header "Starting SSL Certificate Configuration Script"
    print_info "Log file: $LOG_FILE"
    print_info "Error log: $ERROR_LOG"
    
    while true; do
        show_menu
        read -p "Enter your choice (1-8): " choice
        
        case $choice in
            1)
                configure_individual_certificates
                read -p "Press Enter to continue..."
                ;;
            2)
                configure_wildcard_certificate
                read -p "Press Enter to continue..."
                ;;
            3)
                check_ssl_status
                read -p "Press Enter to continue..."
                ;;
            4)
                renew_certificates
                read -p "Press Enter to continue..."
                ;;
            5)
                test_ssl_configuration
                read -p "Press Enter to continue..."
                ;;
            6)
                view_ssl_logs
                read -p "Press Enter to continue..."
                ;;
            7)
                setup_www_subdomain
                read -p "Press Enter to continue..."
                ;;
            8)
                print_header "Exiting SSL configuration script"
                echo ""
                print_info "SSL configuration script completed"
                print_info "Log files available at:"
                print_info "  - $LOG_FILE"
                print_info "  - $ERROR_LOG"
                echo ""
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