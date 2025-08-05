# 🚀 Production Deployment Guide - Din Trafikskola Hässleholm

## Quick Start

The code has been pushed to Git successfully. Now follow these steps to deploy to production:

### Step 1: Connect to Your Server
```bash
ssh root@95.217.143.89
```

### Step 2: Copy and Run the Deployment Script
```bash
# Copy the deployment script to your server
wget https://raw.githubusercontent.com/wagmicrew/TrafikskolaX/master/deploy-production.sh

# Make it executable
chmod +x deploy-production.sh

# Run the deployment
./deploy-production.sh
```

### Step 3: Configure Environment Variables
After the script runs, update the production environment file:
```bash
cd /var/www/dintrafikskolax_prod
nano .env.local
```

**🚨 IMPORTANT:** Update these values in `.env.local`:
- `BREVO_API_KEY` or `SENDGRID_API_KEY` - Your email service API key
- `QLIRO_MERCHANT_API_KEY` - Your Qliro payment API key  
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `DATABASE_URL` - Your complete Neon database connection string

### Step 4: Update Domain DNS
Point your domain to the server:
- **Domain:** `www.dintrafikskolahlm.se` and `dintrafikskolahlm.se`
- **Server IP:** `95.217.143.89`
- **Record Type:** A Record

### Step 5: Test HTTP Site
Once DNS propagates (5-30 minutes), test:
```bash
curl -I http://www.dintrafikskolahlm.se
```

**✅ TELL ME WHEN THIS IS WORKING** so I can proceed with SSL certificates.

### Step 6: Setup SSL Certificates (After HTTP works)
```bash
# Copy and run SSL setup script
wget https://raw.githubusercontent.com/wagmicrew/TrafikskolaX/master/setup-ssl.sh
chmod +x setup-ssl.sh
./setup-ssl.sh
```

## 📊 Final Configuration

After successful deployment, you'll have:

### Development Environment
- **URL:** http://dev.dintrafikskolahlm.se
- **Port:** 3000
- **PM2 Process:** `dintrafikskolax-dev`

### Production Environment  
- **URL:** https://www.dintrafikskolahlm.se
- **Port:** 3001
- **PM2 Process:** `dintrafikskolax-prod`

## 🔧 Management Commands

### Check Application Status
```bash
pm2 status
pm2 logs dintrafikskolax-prod
pm2 logs dintrafikskolax-dev
```

### Restart Applications
```bash
pm2 restart dintrafikskolax-prod
pm2 restart dintrafikskolax-dev
```

### Check Nginx Status
```bash
nginx -t                    # Test configuration
systemctl status nginx     # Check service status
systemctl reload nginx     # Reload configuration
```

### Update Production Code
```bash
cd /var/www/dintrafikskolax_prod
git pull origin master
npm install
npm run build
pm2 restart dintrafikskolax-prod
```

## 🚨 Important Notes

1. **Environment Variables:** All sensitive keys need to be updated in `.env.local`
2. **Database:** Uses Neon PostgreSQL - ensure connection string is correct
3. **Email:** Configure either Brevo or SendGrid for contact forms
4. **Payments:** Qliro integration requires merchant API key
5. **SSL:** Only run SSL setup AFTER domain is pointing to server

## 🔍 Troubleshooting

### Application Won't Start
```bash
pm2 logs dintrafikskolax-prod --lines 50
```

### Nginx Issues
```bash
nginx -t
tail -f /var/log/nginx/dintrafikskolahlm-prod-error.log
```

### SSL Certificate Issues
```bash
certbot certificates
certbot renew --dry-run
```

## 🎯 Next Steps After Deployment

1. **Test all functionality** on the production site
2. **Configure email templates** for booking confirmations
3. **Setup Qliro payment processing** with real credentials
4. **Add Google Analytics** or tracking codes
5. **Test contact forms** and booking system
6. **Monitor server resources** and performance

---

**🚀 Ready to deploy!** Run the deployment script and let me know when the HTTP site is working so we can add SSL certificates.
