const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function test() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    const sql = neon(process.env.DATABASE_URL);
    console.log('Testing database connection...');
    const result = await sql`SELECT 1 as test`;
    console.log('Database connection successful:', result);

    console.log('Testing users table...');
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('Users count:', users[0].count);

    // Test specific user query like the API does
    const userId = '90ade6a9-8898-4473-841e-75f3dbcc862d';
    console.log(`Testing query for user ${userId}...`);
    const user = await sql`SELECT id, email, role, is_active FROM users WHERE id = ${userId}`;
    console.log('User found:', user.length > 0 ? 'Yes' : 'No');
    if (user.length > 0) {
      console.log('User data:', user[0]);
    }

  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

test();

