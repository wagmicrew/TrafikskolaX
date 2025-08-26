#!/usr/bin/env node

/**
 * Quick Setup for Local Development
 *
 * This script creates a minimal .env.local file with secure defaults
 * for local development and testing.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function createMinimalEnv() {
  return `# =================================================================
# TRAFIKSKOLAX - MINIMAL LOCAL DEVELOPMENT SETUP
# =================================================================
# Generated for local development on ${new Date().toISOString()}
# DO NOT use these values in production!

# =================================================================
# DATABASE - UPDATE THIS WITH YOUR NEON URL!
# =================================================================
# Get from: https://console.neon.tech/app/projects
DATABASE_URL="postgresql://username:password@your-neon-host/database?sslmode=require"

# =================================================================
# SECURELY GENERATED SECRETS
# =================================================================
JWT_SECRET="${generateSecret(32)}"
ENCRYPTION_KEY="${generateSecret(32)}"
PERSONAL_ID_ENCRYPTION_KEY="${generateSecret(32)}"
CRON_SECRET_TOKEN="${generateSecret(16)}"

# =================================================================
# DEVELOPMENT DEFAULTS
# =================================================================
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SWISH_NUMBER="1234567890"
NEXT_PUBLIC_QLIRO_MERCHANT_ID="test-merchant-id"

# =================================================================
# TEST VALUES (replace with real ones when needed)
# =================================================================
QLIRO_MERCHANT_ID="test-merchant-id"
QLIRO_API_KEY="test-api-key"
TEORI_API_KEY="test-teori-key"
TEORI_API_SECRET="test-teori-secret"
TEORI_MERCHANT_ID="test-teori-merchant"
TEORI_SHARED_SECRET="test-teori-shared"
SENDGRID_API_KEY="test-sendgrid-key"
ADMIN_EMAIL="admin@example.com"
TEST_TEACHER_EMAIL="teacher@example.com"

# =================================================================
# NEXT STEPS
# =================================================================
# 1. Update DATABASE_URL with your Neon connection string
# 2. Test connection: node scripts/test-database-connection.js
# 3. Start development: npm run dev
# 4. For production, use real API keys and secrets
`;
}

function main() {
  const envPath = path.join(process.cwd(), '.env.local');

  console.log('🚀 TRAFIKSKOLAX QUICK SETUP');
  console.log('===========================\n');

  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists!');
    console.log('   Use: node scripts/setup-environment.js for interactive setup');
    console.log('   Or delete .env.local and run this script again');
    return;
  }

  console.log('📝 Creating .env.local with development defaults...\n');

  const envContent = createMinimalEnv();
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Created .env.local successfully!');
  console.log('');
  console.log('📋 IMPORTANT: You need to update your DATABASE_URL!');
  console.log('');
  console.log('🔧 STEPS TO COMPLETE SETUP:');
  console.log('1. 📡 Get your DATABASE_URL from Neon Console:');
  console.log('   https://console.neon.tech/app/projects');
  console.log('');
  console.log('2. ✏️  Edit .env.local and replace DATABASE_URL');
  console.log('');
  console.log('3. 🧪 Test the connection:');
  console.log('   node scripts/test-database-connection.js');
  console.log('');
  console.log('4. 🚀 Start development:');
  console.log('   npm run dev');
  console.log('');
  console.log('🎯 The file contains secure auto-generated secrets.');
  console.log('   For production, replace test values with real credentials.');
  console.log('');
  console.log('📖 For full setup, run: node scripts/setup-environment.js');
}

// Handle help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
TrafikskolaX Quick Setup

Usage:
  node scripts/quick-setup.js

This script creates a minimal .env.local file for local development.

What it does:
  • ✅ Creates .env.local with secure auto-generated secrets
  • ✅ Sets up development defaults
  • ✅ Includes test values for optional services
  • ❌ Does NOT set up DATABASE_URL (you must do this)

Required next steps:
  1. Get DATABASE_URL from Neon Console
  2. Edit .env.local to add your DATABASE_URL
  3. Test: node scripts/test-database-connection.js
  4. Start: npm run dev

For full interactive setup:
  node scripts/setup-environment.js
  `);
  process.exit(0);
}

main();
