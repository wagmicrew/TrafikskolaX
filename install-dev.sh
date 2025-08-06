#!/bin/bash

# 🚀 Development Installation Script for Din Trafikskola Hässleholm
# This script sets up a local development environment
# Run this script on your local machine

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting development installation for Din Trafikskola Hässleholm...${NC}"
echo -e "${BLUE}📅 Installation started at: $(date)${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
print_info "Checking Node.js installation..."
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18.x or later."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION found"

# Check if npm is installed
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "npm $NPM_VERSION found"

# Check if git is installed
if ! command_exists git; then
    print_error "Git is not installed. Please install Git."
    exit 1
fi

GIT_VERSION=$(git --version)
print_status "$GIT_VERSION found"

# Install dependencies
print_info "Installing project dependencies..."
npm install
print_status "Dependencies installed"

# Create development environment file
print_info "Creating development environment file..."
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
# Development Environment Configuration
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-secret-key-here
JWT_SECRET=your-dev-jwt-secret-here

# Database Configuration
DATABASE_URL=your-dev-database-url-here

# Email Configuration (choose one)
BREVO_API_KEY=your-brevo-api-key-here
# SENDGRID_API_KEY=your-sendgrid-api-key-here

# Payment Configuration
QLIRO_MERCHANT_API_KEY=your-qliro-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    print_status "Development environment file created"
else
    print_warning "Development environment file already exists"
fi

# Create useful scripts
print_info "Creating development scripts..."

# Start development server script
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting development server..."
npm run dev
EOF

# Test scripts script
cat > test-all.sh << 'EOF'
#!/bin/bash
echo "🧪 Running all tests..."

echo "Testing slot availability..."
node scripts/test-slot-availability.js

echo ""
echo "Testing booking blocking..."
node scripts/test-booking-blocking.js

echo ""
echo "Testing slot overlap logic..."
node scripts/test-slot-overlap.js

echo ""
echo "All tests completed!"
EOF

# Database setup script
cat > setup-db.sh << 'EOF'
#!/bin/bash
echo "🗄️  Setting up database..."

# Run database migrations
npm run db:migrate

# Seed initial data if needed
# npm run db:seed

echo "✅ Database setup completed!"
EOF

# Make scripts executable
chmod +x start-dev.sh
chmod +x test-all.sh
chmod +x setup-db.sh

print_status "Development scripts created"

# Create VS Code settings (if VS Code is used)
if command_exists code; then
    print_info "Creating VS Code settings..."
    mkdir -p .vscode
    cat > .vscode/settings.json << 'EOF'
{
    "typescript.preferences.importModuleSpecifier": "relative",
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "files.associations": {
        "*.tsx": "typescriptreact",
        "*.ts": "typescript"
    }
}
EOF
    print_status "VS Code settings created"
fi

# Create helpful documentation
print_info "Creating development documentation..."
cat > DEV_SETUP.md << 'EOF'
# 🚀 Development Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   - Copy `.env.local.example` to `.env.local`
   - Update the environment variables

3. **Setup database:**
   ```bash
   ./setup-db.sh
   ```

4. **Start development server:**
   ```bash
   ./start-dev.sh
   ```

5. **Run tests:**
   ```bash
   ./test-all.sh
   ```

## Environment Variables

Update `.env.local` with your configuration:

- `DATABASE_URL` - Your database connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `BREVO_API_KEY` or `SENDGRID_API_KEY` - Email service API key
- `QLIRO_MERCHANT_API_KEY` - Payment API key

## Available Scripts

- `start-dev.sh` - Start development server
- `test-all.sh` - Run all tests
- `setup-db.sh` - Setup database

## Development URLs

- **Application:** http://localhost:3000
- **API Routes:** http://localhost:3000/api/...

## Testing

The project includes comprehensive test scripts:

- Slot availability testing
- Booking blocking verification
- Time overlap logic testing
- Guest booking validation

Run `./test-all.sh` to execute all tests.

## Database

The project uses Drizzle ORM with PostgreSQL. Run migrations with:

```bash
npm run db:migrate
```

## Troubleshooting

1. **Port already in use:**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection issues:**
   - Check your DATABASE_URL
   - Ensure database is running
   - Run `./setup-db.sh`

3. **Environment variables not loading:**
   - Restart the development server
   - Check `.env.local` file exists
EOF

print_status "Development documentation created"

# Final instructions
echo ""
echo -e "${GREEN}🎉 Development installation completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Update environment variables in .env.local"
echo "2. Setup your database connection"
echo "3. Run: ./setup-db.sh"
echo "4. Start development: ./start-dev.sh"
echo ""
echo -e "${BLUE}🔧 Available Commands:${NC}"
echo "  ./start-dev.sh    # Start development server"
echo "  ./test-all.sh     # Run all tests"
echo "  ./setup-db.sh     # Setup database"
echo "  npm run dev       # Start with npm"
echo "  npm run build     # Build for production"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Update .env.local with your configuration"
echo "- Ensure database is accessible"
echo "- Test all functionality before deploying"
echo ""
echo -e "${GREEN}✅ Development installation completed at: $(date)${NC}" 