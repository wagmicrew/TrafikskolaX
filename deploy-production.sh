#!/bin/bash

# Enhanced Production Deployment Script for Din Trafikskola Hässleholm
# Run this script on your server (95.217.143.89)
# This script handles existing installations, database migrations, and provides comprehensive checks

set -e  # Exit on any error

# Configuration
DEV_DATABASE_URL=""
PROD_DATABASE_URL=""

echo "🚀 Starting enhanced production deployment for Din Trafikskola Hässleholm..."
echo "📅 Deployment started at: $(date)"
echo "🖥️  Server: $(hostname -I | awk '{print $1}')"
echo ""

# Function to prompt for database URLs
get_database_urls() {
    if [ -z "$DEV_DATABASE_URL" ]; then
        echo "🔑 Please provide the development database connection string:"
        read -p "Dev DATABASE_URL: " DEV_DATABASE_URL
    fi
    
    if [ -z "$PROD_DATABASE_URL" ]; then
        echo "🔑 Please provide the production database connection string:"
        read -p "Prod DATABASE_URL: " PROD_DATABASE_URL
    fi
    
    if [ -z "$DEV_DATABASE_URL" ] || [ -z "$PROD_DATABASE_URL" ]; then
        echo "❌ Database URLs are required for deployment!"
        exit 1
    fi

    echo "✅ Database URLs configured"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill PM2 processes safely
kill_pm2_process() {
    local process_name="$1"
    if pm2 list | grep -q "$process_name"; then
        echo "🔴 Stopping existing $process_name process..."
        pm2 delete "$process_name" || true
    fi
}

# Function to test URL with retries
test_url() {
    local url="$1"
    local expected_code="${2:-200}"
    local max_attempts=5
    local attempt=1
    
    echo "🧪 Testing $url (expecting $expected_code)..."
    
    while [ $attempt -le $max_attempts ]; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$response_code" = "$expected_code" ]; then
            echo "✅ $url responded with $response_code (attempt $attempt/$max_attempts)"
            return 0
        else
            echo "⚠️  $url responded with $response_code, expected $expected_code (attempt $attempt/$max_attempts)"
            if [ $attempt -lt $max_attempts ]; then
                echo "   Retrying in 3 seconds..."
                sleep 3
            fi
        fi
        
        ((attempt++))
    done
    
    echo "❌ $url failed after $max_attempts attempts"
    return 1
}

# Stop all existing PM2 processes for clean restart
echo "🛑 Cleaning up existing PM2 processes..."
kill_pm2_process "dintrafikskolax-dev"
kill_pm2_process "dintrafikskolax-prod"
pm2 save

get_database_urls

# Clone/update a temporary directory for migrations
echo "📂 Setting up temporary directory for migrations..."
if [ -d "/tmp/trafikskolax-migration" ]; then
    rm -rf /tmp/trafikskolax-migration
fi

cd /tmp
git clone https://github.com/wagmicrew/TrafikskolaX.git trafikskolax-migration
cd trafikskolax-migration
npm install

# Migrate databases
echo "🔄 Running database migrations for development..."
DATABASE_URL="$DEV_DATABASE_URL" npm run db:migrate

echo "🔄 Running database migrations for production..."
DATABASE_URL="$PROD_DATABASE_URL" npm run db:migrate

# Clean up migration directory
cd /
rm -rf /tmp/trafikskolax-migration
echo "✅ Database migrations completed"

# Update/setup development environment
echo "📦 Setting up development environment..."
if [ -d "/var/www/dintrafikskolax_dev" ]; then
    echo "📁 Development directory exists, updating..."
    cd /var/www/dintrafikskolax_dev
    git fetch origin
    git reset --hard origin/master
    npm install
else
    echo "📁 Creating new development directory..."
    cd /var/www
    git clone https://github.com/wagmicrew/TrafikskolaX.git dintrafikskolax_dev
    cd dintrafikskolax_dev
    npm install
fi

# Create/update dev .env file
echo "⚙️ Setting up development environment file..."
cat > .env.local << EOF
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_SITE_URL=http://dev.dintrafikskolahlm.se

# Database Configuration
DATABASE_URL="$DEV_DATABASE_URL"

# Email Configuration (Brevo/Sendgrid)
BREVO_API_KEY=your_brevo_api_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=info@dintrafikskolahlm.se

# Qliro Payment Configuration (Test)
QLIRO_MERCHANT_API_KEY=your_qliro_test_api_key_here
QLIRO_CHECKOUT_URL=https://checkout-api-stage.qliro.com
QLIRO_ADMIN_URL=https://admin-api-stage.qliro.com

# NextAuth Configuration
NEXTAUTH_URL=http://dev.dintrafikskolahlm.se
NEXTAUTH_SECRET=dev_nextauth_secret_here

# JWT Configuration
JWT_SECRET=dev_jwt_secret_here
EOF

# Create PM2 ecosystem file for development
cat > ecosystem.dev.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'dintrafikskolax-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/dintrafikskolax_dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: '/var/log/pm2/dintrafikskolax-dev-error.log',
      out_file: '/var/log/pm2/dintrafikskolax-dev-out.log',
      log_file: '/var/log/pm2/dintrafikskolax-dev.log'
    }
  ]
};
EOF

npm run build
echo "✅ Development environment ready!"

# Setup/update production environment
echo "🏗️ Setting up production environment..."
if [ -d "/var/www/dintrafikskolax_prod" ]; then
    echo "📁 Production directory exists, updating..."
    cd /var/www/dintrafikskolax_prod
    git fetch origin
    git reset --hard origin/master
    npm install
else
    echo "📁 Creating new production directory..."
    cd /var/www
    mkdir -p dintrafikskolax_prod
    chown -R $(whoami):$(whoami) dintrafikskolax_prod
    cd dintrafikskolax_prod
    git clone https://github.com/wagmicrew/TrafikskolaX.git .
    npm install
fi

npm run build

# Create production .env file
echo "⚙️ Creating production environment file..."
cat > .env.local << EOF
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_SITE_URL=https://www.dintrafikskolahlm.se

# Database Configuration
DATABASE_URL="$PROD_DATABASE_URL"

# Email Configuration (Brevo/Sendgrid)
BREVO_API_KEY=your_brevo_api_key_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=info@dintrafikskolahlm.se

# Qliro Payment Configuration
QLIRO_MERCHANT_API_KEY=your_qliro_api_key_here
QLIRO_CHECKOUT_URL=https://checkout-api.qliro.com
QLIRO_ADMIN_URL=https://admin-api.qliro.com

# NextAuth Configuration
NEXTAUTH_URL=https://www.dintrafikskolahlm.se
NEXTAUTH_SECRET=your_nextauth_secret_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
EOF

echo "🔧 Setting up PM2 for production..."
# Create PM2 ecosystem file for production
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'dintrafikskolax-prod',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dintrafikskolax_prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/dintrafikskolax-prod-error.log',
      out_file: '/var/log/pm2/dintrafikskolax-prod-out.log',
      log_file: '/var/log/pm2/dintrafikskolax-prod.log'
    }
  ]
};
EOF

# Start production application
pm2 start ecosystem.config.js
pm2 save

echo "🌐 Setting up Nginx for production..."
# Create Nginx configuration for production
cat > /etc/nginx/sites-available/dintrafikskolahlm-prod << 'EOF'
server {
    listen 80;
    server_name www.dintrafikskolahlm.se dintrafikskolahlm.se;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Redirect non-www to www
    if ($host = dintrafikskolahlm.se) {
        return 301 http://www.$host$request_uri;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle Next.js API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Error and access logs
    access_log /var/log/nginx/dintrafikskolahlm-prod-access.log;
    error_log /var/log/nginx/dintrafikskolahlm-prod-error.log;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/dintrafikskolahlm-prod /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    # Reload Nginx
    systemctl reload nginx
    echo "✅ Nginx configuration updated and reloaded!"
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# Check if applications are running
echo "🔍 Checking application status..."
pm2 status

# Show final status
echo ""
echo "🎉 Production deployment completed!"
echo ""
echo "📊 Summary:"
echo "  - Development: http://dev.dintrafikskolahlm.se (Port 3000)"
echo "  - Production:  http://www.dintrafikskolahlm.se (Port 3001)"
echo ""
echo "🔧 Next steps:"
echo "  1. Update your domain DNS to point to this server"
echo "  2. Test the HTTP site at http://www.dintrafikskolahlm.se"
echo "  3. Run SSL certificate setup after domain is pointing correctly"
echo ""
echo "📝 SSL Certificate Setup (run after domain is pointing):"
echo "  sudo certbot --nginx -d www.dintrafikskolahlm.se -d dintrafikskolahlm.se"
echo ""
echo "🚨 IMPORTANT: Update .env.local with your actual API keys and secrets!"
