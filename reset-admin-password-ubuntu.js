const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database connection - try different env variables
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!DATABASE_URL) {
  console.error('❌ No database connection string found in environment variables');
  console.log('Please ensure one of these environment variables is set:');
  console.log('- DATABASE_URL');
  console.log('- POSTGRES_URL'); 
  console.log('- POSTGRES_PRISMA_URL');
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
