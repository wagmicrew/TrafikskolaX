#!/bin/bash

# 🚀 Enhanced Deployment Script for Din Trafikskola Hässleholm
# Features: Colorful GUI, Error Handling, Auto Updates, Progress Tracking
# Run this script on your Ubuntu server

# Don't exit on error, handle them gracefully
set +e

# Colors and styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Box drawing characters
TOP_LEFT="╭"
TOP_RIGHT="╮"
BOTTOM_LEFT="╰"
BOTTOM_RIGHT="╯"
HORIZONTAL="─"
VERTICAL="│"

# Configuration
PROJECT_NAME="dintrafikskolax"
GITHUB_REPO="https://github.com/wagmicrew/TrafikskolaX.git"
DEV_PORT=3000
PROD_PORT=3001
DOMAIN="dintrafikskolahlm.se"
DEV_DOMAIN="dev.dintrafikskolahlm.se"

# Log file
LOG_FILE="/var/log/dintrafikskolax-deployment.log"
ERROR_LOG="/var/log/dintrafikskolax-errors.log"

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

print_debug() {
    echo -e "${PURPLE}🔍 DEBUG: $1${NC}"
    echo "$(date): DEBUG - $1" >> "$LOG_FILE"
}

# Function to draw a box
draw_box() {
    local text="$1"
    local width=${2:-50}
    local padding=$(( (width - ${#text} - 2) / 2 ))
    
    echo -e "${PURPLE}$TOP_LEFT${HORIZONTAL:0:padding} $text ${HORIZONTAL:0:padding}$TOP_RIGHT${NC}"
}

# Function to show progress bar
show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((width * current / total))
    local empty=$((width - filled))
    
    printf "\r${CYAN}["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] ${percentage}%%${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if directory exists
directory_exists() {
    [ -d "$1" ]
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to create backup (optional)
create_backup() {
    local backup_dir="/var/backups/dintrafikskolax"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    print_info "Creating backup..."
    mkdir -p "$backup_dir"
    
    if directory_exists "/var/www/${PROJECT_NAME}_prod"; then
        tar -czf "$backup_dir/prod_backup_$timestamp.tar.gz" -C /var/www "${PROJECT_NAME}_prod"
        print_status "Production backup created: prod_backup_$timestamp.tar.gz"
    fi
    
    if directory_exists "/var/www/${PROJECT_NAME}_dev"; then
        tar -czf "$backup_dir/dev_backup_$timestamp.tar.gz" -C /var/www "${PROJECT_NAME}_dev"
        print_status "Development backup created: dev_backup_$timestamp.tar.gz"
    fi
    
    # Backup PM2 configuration
    if command_exists pm2; then
        pm2 save
        cp ~/.pm2/dump.pm2 "$backup_dir/pm2_backup_$timestamp.pm2" 2>/dev/null || true
    fi
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
    
    # Check Ubuntu version
    if ! command_exists lsb_release; then
        print_warning "lsb_release not found, cannot verify Ubuntu version"
    else
        local ubuntu_version=$(lsb_release -rs)
        print_info "Ubuntu version detected: $ubuntu_version"
        if [ "$(echo "$ubuntu_version >= 20.04" | bc -l 2>/dev/null || echo "0")" -eq 0 ]; then
            print_warning "Ubuntu version $ubuntu_version detected. Recommended: 20.04 or later"
        else
            print_status "Ubuntu version $ubuntu_version is compatible"
        fi
    fi
    
    # Check available disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    print_info "Available disk space: ${available_space}KB"
    if [ "$available_space" -lt "$required_space" ]; then
        print_error "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        requirements_met=false
    else
        print_status "Sufficient disk space available"
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

# Function to install system dependencies
install_system_deps() {
    print_header "Installing system dependencies..."
    
    # Update package list first
    print_info "Updating package list..."
    apt update >> "$LOG_FILE" 2>> "$ERROR_LOG"
    if [ $? -ne 0 ]; then
        print_error "Failed to update package list"
        print_debug "apt update failed, but continuing..."
    else
        print_status "Package list updated successfully"
    fi
    
    local deps=("curl" "wget" "git" "unzip" "software-properties-common" "apt-transport-https" "ca-certificates" "gnupg" "lsb-release" "bc")
    local total=${#deps[@]}
    local current=0
    local failed_deps=()
    
    for dep in "${deps[@]}"; do
        ((current++))
        show_progress $current $total
        
        if ! command_exists "$dep"; then
            print_info "Installing $dep..."
            apt install -y "$dep" >> "$LOG_FILE" 2>> "$ERROR_LOG"
            if [ $? -ne 0 ]; then
                print_error "Failed to install $dep"
                failed_deps+=("$dep")
            else
                print_info "$dep installed successfully"
            fi
        else
            print_info "$dep already installed"
        fi
    done
    
    echo ""  # New line after progress bar
    
    if [ ${#failed_deps[@]} -gt 0 ]; then
        print_warning "Some dependencies failed to install: ${failed_deps[*]}"
        print_warning "Continuing with installation..."
    else
        print_status "All system dependencies installed successfully"
    fi
    
    return 0
}

# Function to install Node.js
install_nodejs() {
    print_header "Installing Node.js..."
    
    if command_exists node; then
        local node_version=$(node --version)
        print_info "Node.js $node_version already installed"
    else
        print_info "Installing Node.js 18.x..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to setup Node.js repository"
            print_debug "Node.js repository setup failed, but continuing..."
        else
            print_info "Node.js repository setup successful"
        fi
        
        apt install -y nodejs >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to install Node.js"
            return 1
        fi
        
        print_status "Node.js $(node --version) installed"
    fi
    
    # Install PM2 globally
    if ! command_exists pm2; then
        print_info "Installing PM2..."
        npm install -g pm2 >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to install PM2"
            return 1
        fi
        print_status "PM2 installed"
    else
        print_info "PM2 already installed"
        # Check if PM2 needs updating
        print_info "Checking PM2 version..."
        pm2 update >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -eq 0 ]; then
            print_status "PM2 updated successfully"
        else
            print_warning "PM2 update failed, but continuing..."
        fi
    fi
    
    return 0
}

# Function to install web server
install_webserver() {
    print_header "Installing web server components..."
    
    # Install Nginx
    if ! command_exists nginx; then
        print_info "Installing Nginx..."
        apt install -y nginx >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to install Nginx"
            return 1
        fi
        systemctl enable nginx
        systemctl start nginx
        print_status "Nginx installed and started"
    else
        print_info "Nginx already installed"
    fi
    
    # Install Certbot
    if ! command_exists certbot; then
        print_info "Installing Certbot..."
        apt install -y certbot python3-certbot-nginx >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to install Certbot"
            return 1
        fi
        print_status "Certbot installed"
    else
        print_info "Certbot already installed"
    fi
    
    return 0
}

# Function to setup application
setup_application() {
    local env="$1"  # "dev" or "prod"
    local clean_install="$2"  # "true" or "false"
    local app_dir="/var/www/${PROJECT_NAME}_$env"
    
    print_header "Setting up $env environment..."
    
    # Remove existing directory if clean install
    if [ "$clean_install" = "true" ] && directory_exists "$app_dir"; then
        print_info "Removing existing $env installation for clean install..."
        rm -rf "$app_dir"
    fi
    
    # Create directory if it doesn't exist
    if ! directory_exists "$app_dir"; then
        print_info "Creating $env application directory..."
        mkdir -p "$app_dir"
        chown $SUDO_USER:$SUDO_USER "$app_dir"
    fi
    
    cd "$app_dir"
    
    # Clone or update repository
    if ! directory_exists ".git"; then
        print_info "Cloning repository for $env environment..."
        git clone "$GITHUB_REPO" . >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to clone repository"
            return 1
        fi
    else
        print_info "Updating existing repository..."
        git fetch origin >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to fetch updates"
            return 1
        fi
        git reset --hard origin/master >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to reset to latest version"
            return 1
        fi
    fi
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm install >> "$LOG_FILE" 2>> "$ERROR_LOG"
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        return 1
    fi
    
    # Build for production
    if [ "$env" = "prod" ]; then
        print_info "Building production application..."
        npm run build >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to build application"
            return 1
        fi
    fi
    
    print_status "$env environment setup completed"
    return 0
}

# Function to configure environment
configure_environment() {
    local env="$1"
    local app_dir="/var/www/${PROJECT_NAME}_$env"
    local env_file="$app_dir/.env.local"
    
    print_header "Configuring $env environment..."
    
    # Create environment file if it doesn't exist
    if ! file_exists "$env_file"; then
        print_info "Creating environment file for $env..."
        cat > "$env_file" << EOF
# $env Environment Configuration
NODE_ENV=$env
NEXTAUTH_URL=https://$([ "$env" = "dev" ] && echo "$DEV_DOMAIN" || echo "$DOMAIN")
NEXTAUTH_SECRET=your-$env-secret-key-here
JWT_SECRET=your-$env-jwt-secret-here

# Database Configuration
DATABASE_URL=your-$env-database-url-here

# Email Configuration (choose one)
BREVO_API_KEY=your-brevo-api-key-here
# SENDGRID_API_KEY=your-sendgrid-api-key-here

# Payment Configuration
QLIRO_MERCHANT_API_KEY=your-qliro-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://$([ "$env" = "dev" ] && echo "$DEV_DOMAIN" || echo "$DOMAIN")
PORT=$([ "$env" = "dev" ] && echo "3000" || echo "3001")
EOF
        print_warning "Please update $env_file with your actual configuration values"
    else
        print_info "Environment file already exists"
        # Ensure PORT is set correctly
        if ! grep -q "PORT=" "$env_file"; then
            print_info "Adding PORT configuration..."
            echo "PORT=$([ "$env" = "dev" ] && echo "3000" || echo "3001")" >> "$env_file"
        fi
        # Ensure NODE_ENV is set correctly
        if ! grep -q "NODE_ENV=$env" "$env_file"; then
            print_info "Updating NODE_ENV to $env..."
            sed -i "s/NODE_ENV=.*/NODE_ENV=$env/" "$env_file"
        fi
    fi
    
    print_status "$env environment configured"
    return 0
}

# Function to setup PM2
setup_pm2() {
    print_header "Setting up PM2 process manager..."
    
    # Stop existing PM2 processes
    print_info "Stopping existing PM2 processes..."
    pm2 delete "${PROJECT_NAME}-dev" 2>/dev/null || true
    pm2 delete "${PROJECT_NAME}-prod" 2>/dev/null || true
    
    # Create PM2 ecosystem file
    local ecosystem_file="/var/www/${PROJECT_NAME}_prod/ecosystem.config.js"
    
    cat > "$ecosystem_file" << EOF
module.exports = {
  apps: [
    {
      name: '${PROJECT_NAME}-dev',
      cwd: '/var/www/${PROJECT_NAME}_dev',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: $DEV_PORT
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/${PROJECT_NAME}-dev-error.log',
      out_file: '/var/log/pm2/${PROJECT_NAME}-dev-out.log',
      log_file: '/var/log/pm2/${PROJECT_NAME}-dev-combined.log',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: '${PROJECT_NAME}-prod',
      cwd: '/var/www/${PROJECT_NAME}_prod',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: $PROD_PORT
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/${PROJECT_NAME}-prod-error.log',
      out_file: '/var/log/pm2/${PROJECT_NAME}-prod-out.log',
      log_file: '/var/log/pm2/${PROJECT_NAME}-prod-combined.log',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
EOF
    
    # Create log directory
    mkdir -p /var/log/pm2
    
    # Start applications
    cd "/var/www/${PROJECT_NAME}_prod"
    pm2 start ecosystem.config.js >> "$LOG_FILE" 2>> "$ERROR_LOG"
    if [ $? -ne 0 ]; then
        print_error "Failed to start PM2 applications"
        return 1
    fi
    
    # Wait for applications to start
    print_info "Waiting for applications to start..."
    sleep 15
    
    # Check if applications are running
    if pm2 list | grep -q "${PROJECT_NAME}-dev.*online"; then
        print_status "Development application started successfully"
    else
        print_warning "Development application may not be running properly"
        print_debug "Checking development application logs..."
        pm2 logs "${PROJECT_NAME}-dev" --lines 10
    fi
    
    if pm2 list | grep -q "${PROJECT_NAME}-prod.*online"; then
        print_status "Production application started successfully"
    else
        print_warning "Production application may not be running properly"
        print_debug "Checking production application logs..."
        pm2 logs "${PROJECT_NAME}-prod" --lines 10
    fi
    
    pm2 save
    pm2 startup
    
    print_status "PM2 applications started"
    return 0
}

# Function to setup Nginx
setup_nginx() {
    print_header "Setting up Nginx configuration..."
    
    local nginx_config="/etc/nginx/sites-available/${PROJECT_NAME}"
    
    cat > "$nginx_config" << EOF
# Development Server Configuration
server {
    listen 80;
    server_name $DEV_DOMAIN;
    
    location / {
        proxy_pass http://localhost:$DEV_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Logging
    access_log /var/log/nginx/${PROJECT_NAME}-dev-access.log;
    error_log /var/log/nginx/${PROJECT_NAME}-dev-error.log;
}

# Production Server Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:$PROD_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Logging
    access_log /var/log/nginx/${PROJECT_NAME}-prod-access.log;
    error_log /var/log/nginx/${PROJECT_NAME}-prod-error.log;
}
EOF
    
    # Enable the site
    ln -sf "$nginx_config" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t >> "$LOG_FILE" 2>> "$ERROR_LOG"
    if [ $? -ne 0 ]; then
        print_error "Nginx configuration test failed"
        return 1
    fi
    
    systemctl reload nginx >> "$LOG_FILE" 2>> "$ERROR_LOG"
    if [ $? -ne 0 ]; then
        print_error "Failed to reload Nginx"
        return 1
    fi
    
    print_status "Nginx configuration completed"
    return 0
}

# Function to create management scripts
create_management_scripts() {
    print_header "Creating management scripts..."
    
    # Development management script
    cat > "/usr/local/bin/${PROJECT_NAME}-dev" << 'EOF'
#!/bin/bash
cd /var/www/dintrafikskolax_dev
case "$1" in
    start)
        pm2 start dintrafikskolax-dev
        ;;
    stop)
        pm2 stop dintrafikskolax-dev
        ;;
    restart)
        pm2 restart dintrafikskolax-dev
        ;;
    logs)
        pm2 logs dintrafikskolax-dev
        ;;
    update)
        git pull origin master
        npm install
        pm2 restart dintrafikskolax-dev
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|update}"
        exit 1
        ;;
esac
EOF

    # Production management script
    cat > "/usr/local/bin/${PROJECT_NAME}-prod" << 'EOF'
#!/bin/bash
cd /var/www/dintrafikskolax_prod
case "$1" in
    start)
        pm2 start dintrafikskolax-prod
        ;;
    stop)
        pm2 stop dintrafikskolax-prod
        ;;
    restart)
        pm2 restart dintrafikskolax-prod
        ;;
    logs)
        pm2 logs dintrafikskolax-prod
        ;;
    update)
        git pull origin master
        npm install
        npm run build
        pm2 restart dintrafikskolax-prod
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|update}"
        exit 1
        ;;
esac
EOF

    # Make scripts executable
    chmod +x "/usr/local/bin/${PROJECT_NAME}-dev"
    chmod +x "/usr/local/bin/${PROJECT_NAME}-prod"
    
    print_status "Management scripts created"
    return 0
}

# Function to test deployment
test_deployment() {
    print_header "Testing deployment..."
    
    # Test PM2 processes
    if pm2 list | grep -q "${PROJECT_NAME}-prod"; then
        print_status "Production PM2 process is running"
    else
        print_error "Production PM2 process is not running"
        return 1
    fi
    
    if pm2 list | grep -q "${PROJECT_NAME}-dev"; then
        print_status "Development PM2 process is running"
    else
        print_error "Development PM2 process is not running"
        return 1
    fi
    
    # Test Nginx
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_error "Nginx is not running"
        return 1
    fi
    
    # Enhanced local connection testing with detailed diagnostics
    print_info "Testing development server on port $DEV_PORT..."
    
    # Check if port is listening
    if netstat -tlnp 2>/dev/null | grep -q ":$DEV_PORT "; then
        print_status "Port $DEV_PORT is listening"
    else
        print_warning "Port $DEV_PORT is not listening"
        print_debug "Checking PM2 logs for development server..."
        pm2 logs "${PROJECT_NAME}-dev" --lines 10
    fi
    
    # Test HTTP response with timeout
    local dev_response=$(curl -s --max-time 10 http://localhost:$DEV_PORT 2>/dev/null || echo "TIMEOUT")
    if [ "$dev_response" != "TIMEOUT" ] && [ -n "$dev_response" ]; then
        print_status "Development server responding on port $DEV_PORT"
    else
        print_warning "Development server not responding on port $DEV_PORT"
        print_debug "Attempting to restart development server..."
        pm2 restart "${PROJECT_NAME}-dev" >> "$LOG_FILE" 2>> "$ERROR_LOG"
        sleep 5
        dev_response=$(curl -s --max-time 10 http://localhost:$DEV_PORT 2>/dev/null || echo "TIMEOUT")
        if [ "$dev_response" != "TIMEOUT" ] && [ -n "$dev_response" ]; then
            print_status "Development server now responding after restart"
        else
            print_error "Development server still not responding after restart"
            print_debug "Checking development server logs..."
            pm2 logs "${PROJECT_NAME}-dev" --lines 20
        fi
    fi
    
    # Test production server
    print_info "Testing production server on port $PROD_PORT..."
    if netstat -tlnp 2>/dev/null | grep -q ":$PROD_PORT "; then
        print_status "Port $PROD_PORT is listening"
    else
        print_warning "Port $PROD_PORT is not listening"
    fi
    
    local prod_response=$(curl -s --max-time 10 http://localhost:$PROD_PORT 2>/dev/null || echo "TIMEOUT")
    if [ "$prod_response" != "TIMEOUT" ] && [ -n "$prod_response" ]; then
        print_status "Production server responding on port $PROD_PORT"
    else
        print_warning "Production server not responding on port $PROD_PORT"
        print_debug "Checking PM2 logs for production server..."
        pm2 logs "${PROJECT_NAME}-prod" --lines 10
    fi
    
    # Check environment files
    print_info "Checking environment configuration..."
    local dev_env="/var/www/${PROJECT_NAME}_dev/.env.local"
    local prod_env="/var/www/${PROJECT_NAME}_prod/.env.local"
    
    if [ -f "$dev_env" ]; then
        print_status "Development environment file exists"
        if grep -q "NODE_ENV=development" "$dev_env"; then
            print_status "Development NODE_ENV is correctly set"
        else
            print_warning "Development NODE_ENV may not be set correctly"
        fi
    else
        print_warning "Development environment file missing"
    fi
    
    if [ -f "$prod_env" ]; then
        print_status "Production environment file exists"
        if grep -q "NODE_ENV=production" "$prod_env"; then
            print_status "Production NODE_ENV is correctly set"
        else
            print_warning "Production NODE_ENV may not be set correctly"
        fi
    else
        print_warning "Production environment file missing"
    fi
    
    # Check application directories
    print_info "Checking application directories..."
    if [ -d "/var/www/${PROJECT_NAME}_dev" ]; then
        print_status "Development application directory exists"
        if [ -f "/var/www/${PROJECT_NAME}_dev/package.json" ]; then
            print_status "Development package.json exists"
        else
            print_warning "Development package.json missing"
        fi
    else
        print_error "Development application directory missing"
    fi
    
    if [ -d "/var/www/${PROJECT_NAME}_prod" ]; then
        print_status "Production application directory exists"
        if [ -f "/var/www/${PROJECT_NAME}_prod/package.json" ]; then
            print_status "Production package.json exists"
        else
            print_warning "Production package.json missing"
        fi
    else
        print_error "Production application directory missing"
    fi
    
    print_status "Deployment testing completed"
    return 0
}

# Function to restart applications with correct configuration
restart_applications() {
    print_header "Restarting Applications with Correct Configuration"
    
    print_info "Stopping all applications..."
    pm2 stop all >> "$LOG_FILE" 2>> "$ERROR_LOG"
    pm2 delete all >> "$LOG_FILE" 2>> "$ERROR_LOG"
    
    print_info "Waiting for processes to stop..."
    sleep 5
    
    # Recreate PM2 ecosystem file
    local ecosystem_file="/var/www/${PROJECT_NAME}_prod/ecosystem.config.js"
    
    cat > "$ecosystem_file" << EOF
module.exports = {
  apps: [
    {
      name: '${PROJECT_NAME}-dev',
      cwd: '/var/www/${PROJECT_NAME}_dev',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: $DEV_PORT
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/${PROJECT_NAME}-dev-error.log',
      out_file: '/var/log/pm2/${PROJECT_NAME}-dev-out.log',
      log_file: '/var/log/pm2/${PROJECT_NAME}-dev-combined.log',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: '${PROJECT_NAME}-prod',
      cwd: '/var/www/${PROJECT_NAME}_prod',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: $PROD_PORT
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/${PROJECT_NAME}-prod-error.log',
      out_file: '/var/log/pm2/${PROJECT_NAME}-prod-out.log',
      log_file: '/var/log/pm2/${PROJECT_NAME}-prod-combined.log',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
EOF
    
    print_info "Starting applications with correct configuration..."
    cd "/var/www/${PROJECT_NAME}_prod"
    pm2 start ecosystem.config.js >> "$LOG_FILE" 2>> "$ERROR_LOG"
    
    if [ $? -ne 0 ]; then
        print_error "Failed to start applications"
        return 1
    fi
    
    print_info "Waiting for applications to start..."
    sleep 15
    
    # Check application status
    print_info "Checking application status..."
    pm2 status
    
    # Test applications
    print_info "Testing applications..."
    local dev_response=$(curl -s --max-time 10 http://localhost:$DEV_PORT 2>/dev/null || echo "TIMEOUT")
    if [ "$dev_response" != "TIMEOUT" ] && [ -n "$dev_response" ]; then
        print_status "Development server responding on port $DEV_PORT"
    else
        print_warning "Development server not responding on port $DEV_PORT"
        print_debug "Development server logs:"
        pm2 logs "${PROJECT_NAME}-dev" --lines 10
    fi
    
    local prod_response=$(curl -s --max-time 10 http://localhost:$PROD_PORT 2>/dev/null || echo "TIMEOUT")
    if [ "$prod_response" != "TIMEOUT" ] && [ -n "$prod_response" ]; then
        print_status "Production server responding on port $PROD_PORT"
    else
        print_warning "Production server not responding on port $PROD_PORT"
        print_debug "Production server logs:"
        pm2 logs "${PROJECT_NAME}-prod" --lines 10
    fi
    
    pm2 save
    
    print_status "Applications restarted with correct configuration"
    return 0
}

# Function to fix development server issues
fix_dev_server() {
    print_header "Fixing Development Server Issues"
    
    print_info "Stopping development server..."
    pm2 stop "${PROJECT_NAME}-dev" >> "$LOG_FILE" 2>> "$ERROR_LOG"
    
    print_info "Checking development environment..."
    local dev_dir="/var/www/${PROJECT_NAME}_dev"
    local dev_env="$dev_dir/.env.local"
    
    # Ensure environment file exists with correct settings
    if [ ! -f "$dev_env" ]; then
        print_info "Creating development environment file..."
        cat > "$dev_env" << EOF
# Development Environment Configuration
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-here
JWT_SECRET=dev-jwt-secret-here

# Database Configuration
DATABASE_URL=your-dev-database-url-here

# Email Configuration
BREVO_API_KEY=your-brevo-api-key-here

# Payment Configuration
QLIRO_MERCHANT_API_KEY=your-qliro-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
EOF
        print_status "Development environment file created"
    else
        print_info "Development environment file exists"
        # Ensure NODE_ENV is set to development
        if ! grep -q "NODE_ENV=development" "$dev_env"; then
            print_info "Updating NODE_ENV to development..."
            sed -i 's/NODE_ENV=.*/NODE_ENV=development/' "$dev_env"
        fi
        # Ensure PORT is set
        if ! grep -q "PORT=3000" "$dev_env"; then
            echo "PORT=3000" >> "$dev_env"
        fi
    fi
    
    # Check if dependencies are installed
    print_info "Checking dependencies..."
    if [ ! -d "$dev_dir/node_modules" ]; then
        print_info "Installing dependencies..."
        cd "$dev_dir"
        npm install >> "$LOG_FILE" 2>> "$ERROR_LOG"
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies"
            return 1
        fi
    else
        print_status "Dependencies already installed"
    fi
    
    # Restart with correct configuration
    print_info "Restarting development server with correct configuration..."
    restart_applications
    
    return 0
}

# Function to manage PM2
manage_pm2() {
    print_header "PM2 Management"
    echo ""
    echo -e "${WHITE}Choose a PM2 operation:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Update PM2"
    echo -e "${GREEN}2)${NC} Show PM2 Status"
    echo -e "${GREEN}3)${NC} Restart All Applications"
    echo -e "${GREEN}4)${NC} Stop All Applications"
    echo -e "${GREEN}5)${NC} Show PM2 Logs"
    echo -e "${GREEN}6)${NC} Fix Development Server"
    echo -e "${GREEN}7)${NC} Restart with Correct Configuration"
    echo -e "${GREEN}8)${NC} Back to Main Menu"
    echo ""
    
    read -p "Enter your choice (1-8): " pm2_choice
    
    case $pm2_choice in
        1)
            print_info "Updating PM2..."
            pm2 update >> "$LOG_FILE" 2>> "$ERROR_LOG"
            if [ $? -eq 0 ]; then
                print_status "PM2 updated successfully"
            else
                print_error "PM2 update failed"
            fi
            ;;
        2)
            print_info "PM2 Status:"
            pm2 status
            ;;
        3)
            print_info "Restarting all PM2 applications..."
            pm2 restart all >> "$LOG_FILE" 2>> "$ERROR_LOG"
            if [ $? -eq 0 ]; then
                print_status "All applications restarted"
            else
                print_error "Failed to restart applications"
            fi
            ;;
        4)
            print_info "Stopping all PM2 applications..."
            pm2 stop all >> "$LOG_FILE" 2>> "$ERROR_LOG"
            if [ $? -eq 0 ]; then
                print_status "All applications stopped"
            else
                print_error "Failed to stop applications"
            fi
            ;;
        5)
            print_info "PM2 Logs (last 50 lines):"
            pm2 logs --lines 50
            ;;
        6)
            fix_dev_server
            ;;
        7)
            restart_applications
            ;;
        8)
            return 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
    
    read -p "Press Enter to continue..."
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${CYAN}"
    draw_box "🚀 Din Trafikskola Hässleholm Deployment Script" 60
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}Choose an option:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Install/Update Production Environment"
    echo -e "${GREEN}2)${NC} Install/Update Development Environment"
    echo -e "${GREEN}3)${NC} Install/Update Both Environments"
    echo -e "${GREEN}4)${NC} Clean Install Both Environments"
    echo -e "${GREEN}5)${NC} Show System Status"
    echo -e "${GREEN}6)${NC} View Logs"
    echo -e "${GREEN}7)${NC} Create Backup"
    echo -e "${GREEN}8)${NC} Setup SSL Certificates"
    echo -e "${GREEN}9)${NC} PM2 Management"
    echo -e "${GREEN}10)${NC} Exit"
    echo ""
    echo -e "${YELLOW}Current server: $(hostname -I | awk '{print $1}')${NC}"
    echo -e "${YELLOW}Current time: $(date)${NC}"
    echo ""
}

# Function to handle installation/update
handle_installation() {
    local env="$1"
    local clean_install="${2:-false}"
    
    print_header "Starting $env environment installation/update..."
    
    # Check if installation exists
    local app_dir="/var/www/${PROJECT_NAME}_$env"
    if directory_exists "$app_dir" && [ "$clean_install" = "false" ]; then
        print_info "Existing $env installation detected. Performing update..."
    else
        print_info "No existing $env installation or clean install requested. Performing fresh install..."
    fi
    
    # Perform installation steps
    print_debug "Step 1: Checking requirements..."
    check_requirements || {
        print_error "Requirements check failed"
        return 1
    }
    
    print_debug "Step 2: Installing system dependencies..."
    install_system_deps || {
        print_error "System dependencies installation failed"
        return 1
    }
    
    print_debug "Step 3: Installing Node.js..."
    install_nodejs || {
        print_error "Node.js installation failed"
        return 1
    }
    
    print_debug "Step 4: Installing web server..."
    install_webserver || {
        print_error "Web server installation failed"
        return 1
    }
    
    print_debug "Step 5: Setting up application..."
    setup_application "$env" "$clean_install" || {
        print_error "Application setup failed"
        return 1
    }
    
    print_debug "Step 6: Configuring environment..."
    configure_environment "$env" || {
        print_error "Environment configuration failed"
        return 1
    }
    
    if [ "$env" = "prod" ] || [ "$env" = "both" ]; then
        print_debug "Step 7: Setting up PM2..."
        setup_pm2 || {
            print_error "PM2 setup failed"
            return 1
        }
        
        print_debug "Step 8: Setting up Nginx..."
        setup_nginx || {
            print_error "Nginx setup failed"
            return 1
        }
        
        print_debug "Step 9: Creating management scripts..."
        create_management_scripts || {
            print_error "Management scripts creation failed"
            return 1
        }
    fi
    
    print_debug "Step 10: Testing deployment..."
    test_deployment || {
        print_warning "Deployment testing failed, but installation may still be successful"
    }
    
    print_status "$env environment installation/update completed successfully!"
    return 0
}

# Main script execution
main() {
    # Initialize log files
    touch "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
    
    print_header "Starting enhanced deployment script"
    print_info "Log file: $LOG_FILE"
    print_info "Error log: $ERROR_LOG"
    
    while true; do
        show_menu
        read -p "Enter your choice (1-10): " choice
        
        case $choice in
            1)
                handle_installation "prod" "false"
                if [ $? -eq 0 ]; then
                    print_status "Production installation completed successfully!"
                else
                    print_error "Production installation failed. Check logs for details."
                fi
                read -p "Press Enter to continue..."
                ;;
            2)
                handle_installation "dev" "false"
                if [ $? -eq 0 ]; then
                    print_status "Development installation completed successfully!"
                else
                    print_error "Development installation failed. Check logs for details."
                fi
                read -p "Press Enter to continue..."
                ;;
            3)
                handle_installation "both" "false"
                if [ $? -eq 0 ]; then
                    print_status "Both environments installation completed successfully!"
                else
                    print_error "Both environments installation failed. Check logs for details."
                fi
                read -p "Press Enter to continue..."
                ;;
            4)
                print_warning "This will remove existing installations and perform a clean install!"
                read -p "Are you sure? (y/N): " confirm
                if [[ $confirm =~ ^[Yy]$ ]]; then
                    handle_installation "both" "true"
                    if [ $? -eq 0 ]; then
                        print_status "Clean install completed successfully!"
                    else
                        print_error "Clean install failed. Check logs for details."
                    fi
                else
                    print_info "Clean install cancelled"
                fi
                read -p "Press Enter to continue..."
                ;;
            5)
                print_header "System Status"
                echo ""
                echo -e "${CYAN}PM2 Status:${NC}"
                pm2 status
                echo ""
                echo -e "${CYAN}Nginx Status:${NC}"
                systemctl status nginx --no-pager
                echo ""
                echo -e "${CYAN}Disk Usage:${NC}"
                df -h
                echo ""
                echo -e "${CYAN}Memory Usage:${NC}"
                free -h
                read -p "Press Enter to continue..."
                ;;
            6)
                print_header "Viewing Logs"
                echo ""
                echo -e "${CYAN}Deployment Log:${NC}"
                tail -20 "$LOG_FILE"
                echo ""
                echo -e "${CYAN}Error Log:${NC}"
                tail -20 "$ERROR_LOG"
                read -p "Press Enter to continue..."
                ;;
            7)
                create_backup
                read -p "Press Enter to continue..."
                ;;
            8)
                print_header "SSL Certificate Setup"
                echo ""
                echo -e "${YELLOW}Note: Make sure your domain DNS is configured before setting up SSL${NC}"
                echo ""
                read -p "Enter your domain (e.g., dintrafikskolahlm.se): " domain
                if [ -n "$domain" ]; then
                    print_info "Setting up SSL for $domain..."
                    certbot --nginx -d "$domain" -d "www.$domain" --non-interactive --agree-tos --email admin@"$domain" || {
                        print_error "SSL setup failed"
                    }
                fi
                read -p "Press Enter to continue..."
                ;;
            9)
                manage_pm2
                ;;
            10)
                print_header "Exiting deployment script"
                echo ""
                print_info "Deployment script completed"
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