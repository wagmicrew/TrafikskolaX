const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Try to load .env.local file explicitly
let envConfig = {};
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envConfig[key.trim()] = value.trim().replace(/['"]/g, '');
    }
  });
  console.log('✅ Loaded environment variables from .env.local');
} else {
  // Fall back to process.env
  envConfig = process.env;
  console.log('ℹ️  Using environment variables from process.env');
}

// Database connection - try different env variables
const DATABASE_URL = envConfig.DATABASE_URL || envConfig.POSTGRES_URL || envConfig.POSTGRES_PRISMA_URL;

if (!DATABASE_URL) {
  console.error('❌ No database connection string found in environment variables');
  console.log('Please ensure one of these environment variables is set:');
  console.log('- DATABASE_URL');
  console.log('- POSTGRES_URL'); 
  console.log('- POSTGRES_PRISMA_URL');
  console.log('\nYou can also run this script with environment variables set directly:');
  console.log('DATABASE_URL=your-db-url node reset-admin-password-ubuntu.js');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Function to generate a random password
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function resetAdminPassword() {
  console.log('🔐 Resetting admin password...');
  
  const newPassword = generateRandomPassword(12);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  try {
    // Update the admin user's password
    const result = await sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@dintrafikskolahlm.se' AND role = 'admin'
      RETURNING id, email, first_name, last_name
    `;
    
    if (result.length > 0) {
      console.log('✅ Password reset successfully!');
      console.log('Admin user:', result[0]);
      console.log('\n📋 New credentials:');
      console.log('Email: admin@dintrafikskolahlm.se');
      console.log('Password:', newPassword);
    } else {
      console.log('❌ No admin user found with email: admin@dintrafikskolahlm.se');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    throw error;
  }
}

// Run the reset function
resetAdminPassword()
  .then(() => {
    console.log('\n🎉 Password reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Password reset failed:', error);
    process.exit(1);
  });
