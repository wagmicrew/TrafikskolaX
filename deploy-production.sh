#!/bin/bash

# Production Deployment Script for Din Trafikskola Hässleholm
# Run this script on your server (95.217.143.89)

echo "🚀 Starting production deployment for Din Trafikskola Hässleholm..."

# Update dev environment first
echo "📦 Updating development environment..."
cd /var/www/dintrafikskolax_dev
git pull origin master
npm install
npm run build
pm2 restart dintrafikskolax-dev

echo "✅ Development environment updated!"

# Create production directory
echo "🏗️ Setting up production environment..."
cd /var/www
sudo mkdir -p dintrafikskolax_prod
sudo chown -R root:root dintrafikskolax_prod
cd dintrafikskolax_prod

# Clone repository for production
echo "📥 Cloning repository for production..."
git clone https://github.com/wagmicrew/TrafikskolaX.git .
npm install
npm run build

# Create production .env file
echo "⚙️ Creating production environment file..."
cat > .env.local << 'EOF'
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_SITE_URL=https://www.dintrafikskolahlm.se

# Database Configuration
DATABASE_URL="postgres://johsusers_owner:****@ep-twilight-paper-a2zj1loj.eu-central-1.aws.neon.tech/johsusers?sslmode=require"

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
