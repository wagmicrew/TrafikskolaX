#!/usr/bin/env node

/**
 * Database Setup Helper
 *
 * This script helps you set up your DATABASE_URL for the table removal scripts
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupDatabase() {
  console.log('🔧 Database Setup Helper');
  console.log('========================\n');

  console.log('This script will help you set up your DATABASE_URL.\n');

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('📋 Found existing .env.local file');
    const existing = fs.readFileSync(envPath, 'utf8');
    console.log('Current content:');
    console.log(existing);
    console.log('');

    const overwrite = await ask('Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('✅ Keeping existing configuration');
      rl.close();
      return;
    }
  }

  console.log('📝 Please provide your database connection details:');
  console.log('');

  // Get database URL
  const databaseUrl = await ask('Enter your DATABASE_URL: ');

  if (!databaseUrl || databaseUrl.trim() === '') {
    console.log('❌ DATABASE_URL is required!');
    rl.close();
    return;
  }

  // Create .env.local content
  const envContent = `# Database Configuration
DATABASE_URL="${databaseUrl.trim()}"

# Environment
NODE_ENV="development"
`;

  // Write file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file successfully!');
    console.log('');
    console.log('📄 File content:');
    console.log(envContent);
    console.log('');

    console.log('🔍 Testing connection...');
    console.log('');

    // Test the connection
    const { spawn } = require('child_process');
    const testScript = spawn('node', ['scripts/test-database-connection.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testScript.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nYou can now run the table removal scripts:');
        console.log('  node scripts/dry-run-table-removal.js');
        console.log('  node scripts/verify-table-removal.js');
      } else {
        console.log('\n❌ Database connection test failed.');
        console.log('Please check your DATABASE_URL and try again.');
      }
      rl.close();
    });

  } catch (error) {
    console.log('❌ Failed to create .env.local file:', error.message);
    rl.close();
  }
}

// Handle --help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Setup Helper

Usage:
  node scripts/setup-database.js

This script will:
1. Ask for your DATABASE_URL
2. Create/update .env.local file
3. Test the database connection
4. Guide you to the next steps

For Neon users:
1. Go to https://console.neon.tech/app/projects
2. Select your project
3. Copy the connection string from Dashboard/Connection Details

Example DATABASE_URL:
  postgresql://username:password@ep-xyz.us-east-1.neon.tech/dbname?sslmode=require
  `);
  process.exit(0);
}

// Run setup
setupDatabase().catch(console.error);
