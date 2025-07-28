# TrafikskolaX Deployment Script for Windows
# This script handles deployment to dev.dintrafikskolahlm.se

# Configuration
$RemoteUser = "trafikskolax"
$RemoteHost = "dev.dintrafikskolahlm.se"
$RemotePath = "/var/www/trafikskolax"
$GithubRepo = "https://github.com/wagmicrew/TrafikskolaX.git"
$SSHKey = "$env:USERPROFILE\.ssh\trafikskolax_key"

# Function to deploy via SSH
function Deploy {
    Write-Host "Starting TrafikskolaX deployment..." -ForegroundColor Green
    
    # Build the project
    Write-Host "Building project..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    
    # Deploy using scp or rsync (if available)
    Write-Host "Deploying to remote server..." -ForegroundColor Yellow
    
    # Create deployment package
    $excludes = @("node_modules", ".git", ".env.local", "scripts/deploy-*")
    
    # Use SSH to deploy
    $deployCommand = @"
cd /var/www/trafikskolax
git pull origin master
npm install --production
pm2 restart trafikskolax || pm2 start npm --name 'trafikskolax' -- start
pm2 save
"@
    
    ssh -i $SSHKey "$RemoteUser@$RemoteHost" $deployCommand
    
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
}

# Function to setup remote server
function Setup-Remote {
    Write-Host "Setting up remote server..." -ForegroundColor Yellow
    
    $setupCommand = @"
# Create user if not exists
if ! id -u trafikskolax > /dev/null 2>&1; then
    useradd -m -s /bin/bash trafikskolax
    echo 'User trafikskolax created'
fi

# Create directory
mkdir -p /var/www/trafikskolax
chown -R trafikskolax:trafikskolax /var/www/trafikskolax

# Clone repository
cd /var/www/trafikskolax
git clone https://github.com/wagmicrew/TrafikskolaX.git . || git pull origin master

# Setup nginx site
cat > /etc/nginx/sites-available/trafikskolax << 'EOF'
server {
    listen 80;
    server_name dev.dintrafikskolahlm.se;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
EOF

# Disable other sites and enable this one
rm -f /etc/nginx/sites-enabled/*
ln -sf /etc/nginx/sites-available/trafikskolax /etc/nginx/sites-enabled/

# Test and reload nginx
nginx -t && systemctl reload nginx

echo 'Remote setup completed'
"@
    
    ssh -i $SSHKey "root@$RemoteHost" $setupCommand
}

# Function to push to GitHub
function Push-ToGitHub {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git add .
    $commitMessage = "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMessage
    git push origin master
}

# Function to generate SSH key
function Generate-SSHKey {
    Write-Host "Generating SSH key for TrafikskolaX..." -ForegroundColor Yellow
    
    if (!(Test-Path "$env:USERPROFILE\.ssh")) {
        New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force
    }
    
    if (!(Test-Path $SSHKey)) {
        ssh-keygen -t rsa -b 4096 -f $SSHKey -N '""' -C "trafikskolax@dev.dintrafikskolahlm.se"
        Write-Host "SSH key generated at: $SSHKey" -ForegroundColor Green
        Write-Host "Public key:" -ForegroundColor Yellow
        Get-Content "$SSHKey.pub"
    } else {
        Write-Host "SSH key already exists at: $SSHKey" -ForegroundColor Yellow
        Write-Host "Public key:" -ForegroundColor Yellow
        Get-Content "$SSHKey.pub"
    }
}

# Main execution
$action = $args[0]

switch ($action) {
    "deploy" {
        Deploy
    }
    "setup" {
        Setup-Remote
    }
    "push" {
        Push-ToGitHub
    }
    "full" {
        Push-ToGitHub
        Deploy
    }
    "keygen" {
        Generate-SSHKey
    }
    default {
        Write-Host "Usage: .\deploy-trafikskolax.ps1 {deploy|setup|push|full|keygen}"
        Write-Host "  deploy - Deploy to remote server"
        Write-Host "  setup  - Setup remote server (run once)"
        Write-Host "  push   - Push to GitHub"
        Write-Host "  full   - Push to GitHub and deploy"
        Write-Host "  keygen - Generate SSH key for deployment"
    }
}
