/* eslint-disable @typescript-eslint/no-require-imports */
// Simple script to check existing users
require('dotenv').config({ path: '.env.local' });

const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Raw SQL query to check users table
    const result = await sql`SELECT email, role, first_name, last_name FROM users ORDER BY created_at DESC LIMIT 10`;
    
    if (result.length === 0) {
      console.log('📭 No users found in database');
    } else {
      console.log(`👥 Found ${result.length} users:`);
      result.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ${user.first_name} ${user.last_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers();
