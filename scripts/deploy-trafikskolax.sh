#!/bin/bash

# TrafikskolaX Deployment Script
# This script handles deployment to dev.dintrafikskolahlm.se

# Configuration
REMOTE_USER="trafikskolax"
REMOTE_HOST="dev.dintrafikskolahlm.se"
REMOTE_PATH="/var/www/trafikskolax"
LOCAL_PATH="."
GITHUB_REPO="https://github.com/wagmicrew/TrafikskolaX.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting TrafikskolaX deployment...${NC}"

# Function to deploy via SSH
deploy() {
    echo -e "${YELLOW}Deploying to ${REMOTE_HOST}...${NC}"
    
    # Build the project
    echo -e "${YELLOW}Building project...${NC}"
    npm run build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Build failed!${NC}"
        exit 1
    fi
    
    # Deploy using rsync
    echo -e "${YELLOW}Syncing files to remote server...${NC}"
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.env.local' \
        --exclude 'scripts/deploy-*' \
        -e "ssh -i ~/.ssh/trafikskolax_key" \
        ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Rsync failed!${NC}"
        exit 1
    fi
    
    # Install dependencies and restart PM2 on remote
    echo -e "${YELLOW}Installing dependencies and restarting PM2...${NC}"
    ssh -i ~/.ssh/trafikskolax_key ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
        cd /var/www/trafikskolax
        npm install --production
        pm2 restart trafikskolax || pm2 start npm --name "trafikskolax" -- start
        pm2 save
ENDSSH
    
    echo -e "${GREEN}Deployment completed successfully!${NC}"
}

# Function to setup remote server
setup_remote() {
    echo -e "${YELLOW}Setting up remote server...${NC}"
    
    ssh -i ~/.ssh/trafikskolax_key root@${REMOTE_HOST} << 'ENDSSH'
        # Create user if not exists
        if ! id -u trafikskolax > /dev/null 2>&1; then
            useradd -m -s /bin/bash trafikskolax
            echo "User trafikskolax created"
        fi
        
        # Create directory
        mkdir -p /var/www/trafikskolax
        chown -R trafikskolax:trafikskolax /var/www/trafikskolax
        
        # Setup nginx site
        cat > /etc/nginx/sites-available/trafikskolax << 'EOF'
server {
    listen 80;
    server_name dev.dintrafikskolahlm.se;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
        
        # Disable other sites and enable this one
        rm -f /etc/nginx/sites-enabled/*
        ln -sf /etc/nginx/sites-available/trafikskolax /etc/nginx/sites-enabled/
        
        # Test and reload nginx
        nginx -t && systemctl reload nginx
        
        echo "Remote setup completed"
ENDSSH
}

# Function to push to GitHub
push_to_github() {
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    git add .
    git commit -m "Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')"
    git push origin master
}

# Main execution
case "$1" in
    deploy)
        deploy
        ;;
    setup)
        setup_remote
        ;;
    push)
        push_to_github
        ;;
    full)
        push_to_github
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|setup|push|full}"
        echo "  deploy - Deploy to remote server"
        echo "  setup  - Setup remote server (run once)"
        echo "  push   - Push to GitHub"
        echo "  full   - Push to GitHub and deploy"
        exit 1
        ;;
esac
