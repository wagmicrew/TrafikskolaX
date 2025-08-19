// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');

// Define the users table schema inline since we can't import it easily
const users = {
  id: { name: 'id' },
  email: { name: 'email' },
  firstName: { name: 'first_name' },
  lastName: { name: 'last_name' },
  role: { name: 'role' },
  password: { name: 'password' },
  isActive: { name: 'is_active' }
};

async function getAdminPassword() {
  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable is not set');
      console.error('Make sure you have a .env.local file with DATABASE_URL');
      process.exit(1);
    }

    // Create database connection
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    // Query for admin user using raw SQL
    const adminUsers = await sql`
      SELECT 
        id,
        email,
        first_name as "firstName",
        last_name as "lastName",
        role,
        password,
        is_active as "isActive"
      FROM users 
      WHERE role = 'admin'
      LIMIT 5
    `;

    if (adminUsers.length === 0) {
      console.log('No admin users found in the database');
      return;
    }

    console.log('\n=== Admin Users Found ===\n');
    
    adminUsers.forEach((user, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Password Hash: ${user.password}`);
      console.log('');
    });

    console.log('Note: The password is stored as a bcrypt hash and cannot be decrypted.');
    console.log('To reset the admin password, you can:');
    console.log('1. Use the admin panel to generate a new password');
    console.log('2. Or manually update the password hash in the database');
    console.log('3. Or use the password reset functionality');

  } catch (error) {
    console.error('Error fetching admin password:', error);
    process.exit(1);
  }
}

// Run the script
getAdminPassword();
