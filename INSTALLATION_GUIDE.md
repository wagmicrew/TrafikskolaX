# 🚀 Installation Guide - Din Trafikskola Hässleholm

This guide provides comprehensive instructions for installing the Din Trafikskola Hässleholm application on both development and production environments.

## 📋 Prerequisites

### For Development (Local Machine)
- **Node.js** 18.x or later
- **npm** or **yarn**
- **Git**
- **PostgreSQL** database (local or cloud)

### For Production (Ubuntu Server)
- **Ubuntu** 20.04 LTS or later
- **Root access** or sudo privileges
- **Domain name** pointing to server
- **PostgreSQL** database (recommended: Neon, Supabase, or AWS RDS)

## 🛠️ Installation Options

### Option 1: Automated Installation (Recommended)

#### For Ubuntu Server (Production)
```bash
# Download and run the Ubuntu installation script
wget https://raw.githubusercontent.com/wagmicrew/TrafikskolaX/master/install-ubuntu.sh
chmod +x install-ubuntu.sh
sudo ./install-ubuntu.sh
```

#### For Local Development
```bash
# Download and run the development installation script
wget https://raw.githubusercontent.com/wagmicrew/TrafikskolaX/master/install-dev.sh
chmod +x install-dev.sh
./install-dev.sh
```

### Option 2: Manual Installation

#### Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wagmicrew/TrafikskolaX.git
   cd TrafikskolaX
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Setup database:**
   ```bash
   npm run db:migrate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

#### Production Environment

1. **Install system dependencies:**
   ```bash
   sudo apt update
   sudo apt install -y curl wget git unzip software-properties-common
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

4. **Install Nginx:**
   ```bash
   sudo apt install -y nginx
   ```

5. **Install Certbot:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

6. **Clone and setup application:**
   ```bash
   sudo mkdir -p /var/www/dintrafikskolax_prod
   sudo chown $USER:$USER /var/www/dintrafikskolax_prod
   cd /var/www/dintrafikskolax_prod
   git clone https://github.com/wagmicrew/TrafikskolaX.git .
   npm install
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

Create `.env.local` with the following variables:

```bash
# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Email Configuration (choose one)
BREVO_API_KEY=your-brevo-api-key-here
# SENDGRID_API_KEY=your-sendgrid-api-key-here

# Payment Configuration
QLIRO_MERCHANT_API_KEY=your-qliro-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Generate Secrets

Generate secure secrets for production:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

## 🌐 Domain Configuration

### DNS Setup

Point your domain to your server:

- **A Record:** `yourdomain.com` → `YOUR_SERVER_IP`
- **A Record:** `www.yourdomain.com` → `YOUR_SERVER_IP`
- **A Record:** `dev.yourdomain.com` → `YOUR_SERVER_IP` (for development)

### SSL Certificates

After DNS is configured, setup SSL:

```bash
# For production domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For development domain
sudo certbot --nginx -d dev.yourdomain.com
```

## 🚀 Management Commands

### Development Environment

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Database operations
npm run db:migrate
npm run db:generate
```

### Production Environment

#### PM2 Management
```bash
# Check status
pm2 status

# View logs
pm2 logs dintrafikskolax-prod
pm2 logs dintrafikskolax-dev

# Restart applications
pm2 restart dintrafikskolax-prod
pm2 restart dintrafikskolax-dev

# Update applications
cd /var/www/dintrafikskolax_prod
git pull origin master
npm install
npm run build
pm2 restart dintrafikskolax-prod
```

#### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

#### System Management
```bash
# Check all services
/usr/local/bin/check-status.sh

# Create backup
/usr/local/bin/backup-app.sh

# Setup SSL
/usr/local/bin/setup-ssl.sh
```

## 🧪 Testing

### Automated Tests

The project includes comprehensive test scripts:

```bash
# Test slot availability
node scripts/test-slot-availability.js

# Test booking blocking
node scripts/test-booking-blocking.js

# Test slot overlap logic
node scripts/test-slot-overlap.js

# Test guest validation
node scripts/test-guest-validation.js
```

### Manual Testing

1. **Test booking flow:**
   - Visit the booking page
   - Select a lesson type
   - Choose a date and time
   - Complete the booking process

2. **Test admin functions:**
   - Login as admin
   - Test export functions
   - Test email templates
   - Test user management

3. **Test payment integration:**
   - Test Swish payment flow
   - Test Qliro payment flow
   - Verify payment confirmations

## 🔍 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs dintrafikskolax-prod --lines 50

# Check environment variables
cat /var/www/dintrafikskolax_prod/.env.local

# Check database connection
node -e "console.log(process.env.DATABASE_URL)"
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Run migrations
npm run db:migrate

# Check database schema
npm run db:generate
```

#### Nginx Issues
```bash
# Test configuration
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log

# Reload configuration
systemctl reload nginx
```

#### SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
```

### Performance Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check network connections
netstat -tulpn
```

## 📊 Monitoring and Maintenance

### Regular Maintenance

1. **Daily:**
   - Check application logs
   - Monitor system resources
   - Verify backups

2. **Weekly:**
   - Update dependencies
   - Review error logs
   - Test backup restoration

3. **Monthly:**
   - Security updates
   - Performance optimization
   - SSL certificate renewal

### Backup Strategy

```bash
# Create backup
/usr/local/bin/backup-app.sh

# Restore from backup
tar -xzf backup_file.tar.gz -C /var/www/
pm2 restart dintrafikskolax-prod
```

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit `.env.local` to git
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Database Security:**
   - Use strong passwords
   - Enable SSL connections
   - Regular security updates

3. **Server Security:**
   - Keep system updated
   - Configure firewall
   - Monitor access logs

4. **Application Security:**
   - Regular dependency updates
   - Input validation
   - SQL injection prevention

## 📞 Support

For issues and support:

1. **Check the logs:**
   ```bash
   pm2 logs dintrafikskolax-prod
   tail -f /var/log/nginx/error.log
   ```

2. **Review documentation:**
   - `Documentation/README.md`
   - `Documentation/DEVELOPMENT_GUIDELINES.md`
   - `Documentation/API_ENDPOINTS.md`

3. **Test functionality:**
   - Run test scripts
   - Check API endpoints
   - Verify database connections

## ✅ Installation Checklist

- [ ] System dependencies installed
- [ ] Node.js and npm installed
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database connected and migrations run
- [ ] Nginx configured and running
- [ ] PM2 processes started
- [ ] Domain DNS configured
- [ ] SSL certificates installed
- [ ] All tests passing
- [ ] Backup strategy implemented
- [ ] Monitoring configured

---

**🎉 Installation Complete!** Your Din Trafikskola Hässleholm application is now ready for use. 