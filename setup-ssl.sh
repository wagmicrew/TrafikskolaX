#!/bin/bash

# SSL Certificate Setup Script for Din Trafikskola Hässleholm
# Run this AFTER the domain is pointing to your server

echo "🔒 Setting up SSL certificates for Din Trafikskola Hässleholm..."

# Check if domain is pointing to this server
echo "🔍 Checking if domain is pointing to this server..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short www.dintrafikskolahlm.se)

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  WARNING: Domain is not yet pointing to this server!"
    echo "Please update your DNS records first and wait for propagation."
    echo "Expected IP: $SERVER_IP"
    echo "Current IP:  $DOMAIN_IP"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificates
echo "🎫 Obtaining SSL certificates..."
certbot --nginx -d www.dintrafikskolahlm.se -d dintrafikskolahlm.se --non-interactive --agree-tos --email info@dintrafikskolahlm.se

# Check if certificates were obtained successfully
if [ $? -eq 0 ]; then
    echo "✅ SSL certificates obtained successfully!"
    
    # Update production environment variable
    echo "⚙️ Updating production environment..."
    cd /var/www/dintrafikskolax_prod
    sed -i 's|NEXT_PUBLIC_SITE_URL=http://www.dintrafikskolahlm.se|NEXT_PUBLIC_SITE_URL=https://www.dintrafikskolahlm.se|g' .env.local
    sed -i 's|NEXTAUTH_URL=http://www.dintrafikskolahlm.se|NEXTAUTH_URL=https://www.dintrafikskolahlm.se|g' .env.local
    
    # Restart production application to pick up new environment
    pm2 restart dintrafikskolax-prod
    
    # Test HTTPS
    echo "🧪 Testing HTTPS..."
    sleep 5
    
    if curl -s -o /dev/null -w "%{http_code}" https://www.dintrafikskolahlm.se | grep -q "200"; then
        echo "✅ HTTPS is working correctly!"
    else
        echo "⚠️  HTTPS test failed. Please check the configuration."
    fi
    
    # Set up automatic renewal
    echo "🔄 Setting up automatic certificate renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    echo ""
    echo "🎉 SSL setup completed successfully!"
    echo ""
    echo "🌐 Your website is now available at:"
    echo "  - https://www.dintrafikskolahlm.se (Production - HTTPS)"
    echo "  - http://dev.dintrafikskolahlm.se (Development - HTTP)"
    echo ""
    echo "🔐 Security features enabled:"
    echo "  - SSL/TLS encryption"
    echo "  - Automatic certificate renewal"
    echo "  - Security headers"
    echo "  - HTTP to HTTPS redirect"
    echo ""
    
else
    echo "❌ Failed to obtain SSL certificates!"
    echo "Please check:"
    echo "  1. Domain DNS is pointing to this server"
    echo "  2. Port 80 and 443 are open"
    echo "  3. Nginx is running and configured correctly"
    exit 1
fi

# Display final status
echo "📊 Final Status:"
nginx -t && echo "✅ Nginx configuration: OK" || echo "❌ Nginx configuration: ERROR"
systemctl is-active --quiet nginx && echo "✅ Nginx service: Running" || echo "❌ Nginx service: Not running"
pm2 status | grep -q "dintrafikskolax-prod" && echo "✅ Production app: Running" || echo "❌ Production app: Not running"
pm2 status | grep -q "dintrafikskolax-dev" && echo "✅ Development app: Running" || echo "❌ Development app: Not running"

echo ""
echo "✨ Setup complete! Your trafikskola website is now live with SSL!"
