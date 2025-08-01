const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');

// Direct database URL for testing
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function findAdminUsers() {
  try {
    const neonSql = neon(DATABASE_URL);
    const db = drizzle(neonSql);
    
    console.log('🔍 Finding admin users...\n');
    
    const adminUsers = await db.execute(sql`
      SELECT id, email, first_name, last_name, role, is_active
      FROM users 
      WHERE role = 'admin'
      ORDER BY email
    `);
    
    console.log(`Found ${adminUsers.rows.length} admin user(s):\n`);
    
    adminUsers.rows.forEach((user, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.first_name} ${user.last_name}`);
      console.log(`  Active: ${user.is_active}`);
      console.log('');
    });
    
    // Also look for a specific test user
    console.log('🔍 Checking for specific test user...\n');
    const testUser = await db.execute(sql`
      SELECT id, email, first_name, last_name, role
      FROM users 
      WHERE id = 'd601c43a-599c-4715-8b9a-65fe092c6c11'
    `);
    
    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      console.log('Test user found:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.first_name} ${user.last_name}`);
      console.log(`  Role: ${user.role}`);
    } else {
      console.log('Test user not found with ID: d601c43a-599c-4715-8b9a-65fe092c6c11');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAdminUsers();
