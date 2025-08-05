# Enhanced Production Deployment Script for Din Trafikskola Hässleholm (PowerShell)
# Run this script on your server
# This script handles existing installations, database migrations, and provides comprehensive checks

$ErrorActionPreference = "Stop"

# Configuration
$DEV_DATABASE_URL = ""
$PROD_DATABASE_URL = ""

Write-Host "🚀 Starting enhanced production deployment for Din Trafikskola Hässleholm..." -ForegroundColor Green
Write-Host "📅 Deployment started at: $(Get-Date)" -ForegroundColor Cyan
Write-Host "🖥️  Server: $env:COMPUTERNAME" -ForegroundColor Cyan
Write-Host ""

# Function to prompt for database URLs
function Get-DatabaseUrls {
    if ([string]::IsNullOrEmpty($script:DEV_DATABASE_URL)) {
        Write-Host "🔑 Please provide the development database connection string:" -ForegroundColor Yellow
        $script:DEV_DATABASE_URL = Read-Host "Dev DATABASE_URL"
    }
    
    if ([string]::IsNullOrEmpty($script:PROD_DATABASE_URL)) {
        Write-Host "🔑 Please provide the production database connection string:" -ForegroundColor Yellow
        $script:PROD_DATABASE_URL = Read-Host "Prod DATABASE_URL"
    }
    
    if ([string]::IsNullOrEmpty($script:DEV_DATABASE_URL) -or [string]::IsNullOrEmpty($script:PROD_DATABASE_URL)) {
        Write-Host "❌ Database URLs are required for deployment!" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Database URLs configured" -ForegroundColor Green
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to kill PM2 processes safely
function Stop-PM2Process {
    param([string]$ProcessName)
    
    try {
        $processes = pm2 list 2>$null | Out-String
        if ($processes -match $ProcessName) {
            Write-Host "🔴 Stopping existing $ProcessName process..." -ForegroundColor Red
            pm2 delete $ProcessName 2>$null
        }
    } catch {
        # Ignore errors when stopping processes
    }
}

# Function to test URL with retries
function Test-Url {
    param(
        [string]$Url,
        [int]$ExpectedCode = 200,
        [int]$MaxAttempts = 5
    )
    
    Write-Host "🧪 Testing $Url (expecting $ExpectedCode)..." -ForegroundColor Cyan
    
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method HEAD -TimeoutSec 10 -ErrorAction SilentlyContinue
            $responseCode = $response.StatusCode
        } catch {
            $responseCode = 0
        }
        
        if ($responseCode -eq $ExpectedCode) {
            Write-Host "✅ $Url responded with $responseCode (attempt $attempt/$MaxAttempts)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  $Url responded with $responseCode, expected $ExpectedCode (attempt $attempt/$MaxAttempts)" -ForegroundColor Yellow
            if ($attempt -lt $MaxAttempts) {
                Write-Host "   Retrying in 3 seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds 3
            }
        }
    }
    
    Write-Host "❌ $Url failed after $MaxAttempts attempts" -ForegroundColor Red
    return $false
}

# Stop all existing PM2 processes for clean restart
Write-Host "🛑 Cleaning up existing PM2 processes..." -ForegroundColor Yellow
Stop-PM2Process "dintrafikskolax-dev"
Stop-PM2Process "dintrafikskolax-prod"
try { pm2 save } catch { }

Get-DatabaseUrls

# Clone/update a temporary directory for migrations
Write-Host "📂 Setting up temporary directory for migrations..." -ForegroundColor Cyan
$tempDir = "$env:TEMP\trafikskolax-migration"

if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

Set-Location $env:TEMP
git clone https://github.com/wagmicrew/TrafikskolaX.git trafikskolax-migration
Set-Location $tempDir
npm install

# Migrate databases
Write-Host "🔄 Running database migrations for development..." -ForegroundColor Cyan
$env:DATABASE_URL = $DEV_DATABASE_URL
npm run db:migrate

Write-Host "🔄 Running database migrations for production..." -ForegroundColor Cyan
$env:DATABASE_URL = $PROD_DATABASE_URL
npm run db:migrate

# Clean up migration directory
Set-Location C:\
Remove-Item -Path $tempDir -Recurse -Force
Write-Host "✅ Database migrations completed" -ForegroundColor Green

# Update/setup development environment
Write-Host "📦 Setting up development environment..." -ForegroundColor Cyan
$devDir = "C:\var\www\dintrafikskolax_dev"

if (Test-Path $devDir) {
    Write-Host "📁 Development directory exists, updating..." -ForegroundColor Yellow
    Set-Location $devDir
    git fetch origin
    git reset --hard origin/master
    npm install
} else {
    Write-Host "📁 Creating new development directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "C:\var\www" -Force | Out-Null
    Set-Location "C:\var\www"
    git clone https://github.com/wagmicrew/TrafikskolaX.git dintrafikskolax_dev
    Set-Location dintrafikskolax_dev
    npm install
}

# Create/update dev .env file
Write-Host "⚙️ Setting up development environment file..." -ForegroundColor Cyan
@"
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
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

# Create PM2 ecosystem file for development
Write-Host "🔧 Creating PM2 ecosystem file for development..." -ForegroundColor Cyan
@"
module.exports = {
  apps: [
    {
      name: 'dintrafikskolax-dev',
      script: 'npm',
      args: 'run dev',
      cwd: 'C:/var/www/dintrafikskolax_dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: 'C:/var/log/pm2/dintrafikskolax-dev-error.log',
      out_file: 'C:/var/log/pm2/dintrafikskolax-dev-out.log',
      log_file: 'C:/var/log/pm2/dintrafikskolax-dev.log'
    }
  ]
};
"@ | Out-File -FilePath "ecosystem.dev.config.js" -Encoding UTF8

npm run build
Write-Host "✅ Development environment ready!" -ForegroundColor Green

# Setup/update production environment
Write-Host "🏗️ Setting up production environment..." -ForegroundColor Cyan
$prodDir = "C:\var\www\dintrafikskolax_prod"

if (Test-Path $prodDir) {
    Write-Host "📁 Production directory exists, updating..." -ForegroundColor Yellow
    Set-Location $prodDir
    git fetch origin
    git reset --hard origin/master
    npm install
} else {
    Write-Host "📁 Creating new production directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "C:\var\www" -Force | Out-Null
    Set-Location "C:\var\www"
    New-Item -ItemType Directory -Path "dintrafikskolax_prod"
    Set-Location dintrafikskolax_prod
    git clone https://github.com/wagmicrew/TrafikskolaX.git .
    npm install
}

npm run build

# Create production .env file
Write-Host "⚙️ Creating production environment file..." -ForegroundColor Cyan
@"
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
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "🔧 Setting up PM2 for production..." -ForegroundColor Cyan
# Create PM2 ecosystem file for production
@"
module.exports = {
  apps: [
    {
      name: 'dintrafikskolax-prod',
      script: 'npm',
      args: 'start',
      cwd: 'C:/var/www/dintrafikskolax_prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: 'C:/var/log/pm2/dintrafikskolax-prod-error.log',
      out_file: 'C:/var/log/pm2/dintrafikskolax-prod-out.log',
      log_file: 'C:/var/log/pm2/dintrafikskolax-prod.log'
    }
  ]
};
"@ | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8

# Start production application
Write-Host "🚀 Starting PM2 applications..." -ForegroundColor Cyan
pm2 start ecosystem.config.js
pm2 save

# Check if applications are running
Write-Host "🔍 Checking application status..." -ForegroundColor Cyan
pm2 status

# Show final status
Write-Host ""
Write-Host "🎉 Production deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Development: http://dev.dintrafikskolahlm.se (Port 3000)" -ForegroundColor White
Write-Host "  - Production:  http://www.dintrafikskolahlm.se (Port 3001)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update your domain DNS to point to this server" -ForegroundColor White
Write-Host "  2. Test the HTTP site at http://www.dintrafikskolahlm.se" -ForegroundColor White
Write-Host "  3. Setup reverse proxy (nginx/IIS) for production" -ForegroundColor White
Write-Host ""
Write-Host "🚨 IMPORTANT: Update .env.local with your actual API keys and secrets!" -ForegroundColor Red
