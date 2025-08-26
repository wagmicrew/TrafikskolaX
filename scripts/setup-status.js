#!/usr/bin/env node

/**
 * Setup Status Checker
 *
 * This script checks your current environment setup
 * and shows what's configured and what needs attention.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function checkEnvVariable(name, required = false, description = '') {
  const value = process.env[name];
  const exists = !!value;
  const isSet = exists && value !== '' && value !== 'undefined';

  return {
    name,
    value: value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'Not set',
    exists,
    isSet,
    required,
    description,
    status: required && !isSet ? '❌ REQUIRED' : isSet ? '✅ OK' : '⚠️  OPTIONAL'
  };
}

function checkFile(filePath, description = '') {
  const exists = fs.existsSync(filePath);
  return {
    name: path.basename(filePath),
    path: filePath,
    exists,
    description,
    status: exists ? '✅ Found' : '❌ Missing'
  };
}

function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    return { status: '❌ No DATABASE_URL', connected: false };
  }

  try {
    // Just check if URL looks valid, don't actually connect
    const url = process.env.DATABASE_URL;
    const isValidFormat = url.startsWith('postgresql://') && url.includes('@') && url.includes('?sslmode=');

    if (!isValidFormat) {
      return { status: '❌ Invalid format', connected: false };
    }

    return { status: '✅ Valid format (not tested)', connected: null };
  } catch (error) {
    return { status: '❌ Error parsing', connected: false };
  }
}

function main() {
  console.log('🔍 TRAFIKSKOLAX SETUP STATUS');
  console.log('===========================\n');

  // Check environment files
  console.log('📁 ENVIRONMENT FILES:');
  console.log('===================');

  const files = [
    { path: '.env.local', description: 'Your environment configuration' },
    { path: 'ENV_LOCAL_TEMPLATE.txt', description: 'Template with all variables' },
    { path: 'SETUP_GUIDE.md', description: 'Complete setup instructions' },
    { path: 'DATABASE_SETUP.md', description: 'Database setup guide' }
  ];

  files.forEach(file => {
    const status = checkFile(file.path, file.description);
    console.log(`${status.status} ${status.name} - ${status.description}`);
  });

  console.log('');

  // Check environment variables
  console.log('🔧 ENVIRONMENT VARIABLES:');
  console.log('========================');

  const envVars = [
    ['DATABASE_URL', true, 'Database connection string from Neon'],
    ['JWT_SECRET', true, 'Secure key for JWT authentication'],
    ['NEXT_PUBLIC_APP_URL', true, 'Your app URL for redirects'],
    ['ENCRYPTION_KEY', true, 'Key for encrypting sensitive data'],
    ['NODE_ENV', false, 'Environment mode (development/production)'],
    ['NEXT_PUBLIC_SWISH_NUMBER', false, 'Swish payment number'],
    ['QLIRO_MERCHANT_ID', false, 'Qliro payment merchant ID'],
    ['SENDGRID_API_KEY', false, 'Email service API key'],
    ['ADMIN_EMAIL', false, 'Admin email for notifications']
  ];

  const envStatus = envVars.map(([name, required, description]) =>
    checkEnvVariable(name, required, description)
  );

  envStatus.forEach(env => {
    console.log(`${env.status} ${env.name} = ${env.value}`);
    if (env.description) {
      console.log(`   ${env.description}`);
    }
  });

  console.log('');

  // Check database connection
  console.log('🗃️  DATABASE STATUS:');
  console.log('==================');

  const dbStatus = checkDatabaseConnection();
  console.log(`Status: ${dbStatus.status}`);

  if (dbStatus.status.includes('❌')) {
    console.log('💡 To fix:');
    console.log('   1. Get DATABASE_URL from Neon Console');
    console.log('   2. Add it to .env.local');
    console.log('   3. Test: node scripts/test-database-connection.js');
  }

  console.log('');

  // Overall status
  console.log('📊 OVERALL STATUS:');
  console.log('================');

  const requiredEnvSet = envStatus.filter(e => e.required && e.isSet).length;
  const totalRequired = envStatus.filter(e => e.required).length;
  const dbConfigured = dbStatus.status.includes('✅');

  console.log(`Environment: ${requiredEnvSet}/${totalRequired} required variables set`);
  console.log(`Database: ${dbConfigured ? '✅ Configured' : '❌ Not configured'}`);

  const filesExist = files.filter(f => checkFile(f.path).exists).length;
  console.log(`Files: ${filesExist}/${files.length} setup files available`);

  console.log('');

  // Recommendations
  console.log('🎯 RECOMMENDATIONS:');
  console.log('=================');

  const missingRequired = envStatus.filter(e => e.required && !e.isSet);
  const missingFiles = files.filter(f => !checkFile(f.path).exists);

  if (missingRequired.length > 0) {
    console.log('❌ Fix these required variables:');
    missingRequired.forEach(env => {
      console.log(`   • ${env.name}`);
    });
  }

  if (!dbConfigured) {
    console.log('❌ Set up DATABASE_URL:');
    console.log('   • Get from: https://console.neon.tech/app/projects');
    console.log('   • Add to .env.local');
  }

  if (missingFiles.length > 0) {
    console.log('⚠️  Missing setup files (not critical):');
    missingFiles.forEach(file => {
      console.log(`   • ${file.path}`);
    });
  }

  // Success state
  if (requiredEnvSet === totalRequired && dbConfigured) {
    console.log('🎉 Your environment is fully configured!');
    console.log('');
    console.log('🚀 Ready to run:');
    console.log('   • npm run dev');
    console.log('   • node scripts/test-database-connection.js');
    console.log('   • node scripts/test-unified-teori-system.js');
  } else {
    console.log('🔧 Run setup scripts:');
    console.log('   • Quick setup: node scripts/quick-setup.js');
    console.log('   • Full setup: node scripts/setup-environment.js');
    console.log('   • Help: node scripts/quick-setup.js --help');
  }

  console.log('');
  console.log('📖 Read the guides:');
  console.log('   • SETUP_GUIDE.md');
  console.log('   • DATABASE_SETUP.md');
  console.log('   • ENV_LOCAL_TEMPLATE.txt');
}

// Handle help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
TrafikskolaX Setup Status Checker

Usage:
  node scripts/setup-status.js

This script checks:
  • Environment files (.env.local, templates, guides)
  • Environment variables (required and optional)
  • Database configuration
  • Overall setup completeness

It provides:
  • Clear status indicators (✅ ❌ ⚠️)
  • Specific recommendations for fixes
  • Next steps for completion

No changes are made to your system.
  `);
  process.exit(0);
}

main();
