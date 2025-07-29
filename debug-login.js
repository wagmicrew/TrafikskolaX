// Debug login issue by testing exact column access
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');

// Direct database URL for testing
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('🔍 Debugging login column access...');

async function debugLogin() {
  try {
    // Create NEON connection
    const neonSql = neon(DATABASE_URL);
    
    // Create Drizzle instance
    const db = drizzle(neonSql);
    
    console.log('✅ Connected to database');
    
    const email = 'admin@test.se';
    
    console.log(`\n🔍 Testing column access for ${email}...`);
    
    // Test 1: Raw SQL to see what columns exist
    console.log('\n1. Raw SQL test:');
    const rawResult = await db.execute(sql`
      SELECT id, email, password, first_name, last_name, role, is_active 
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `);
    
    if (rawResult.rows.length > 0) {
      const user = rawResult.rows[0];
      console.log('✅ Raw SQL works:', {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active
      });
    }
    
    // Test 2: Try to access with camelCase (what the code expects)
    console.log('\n2. Testing camelCase access:');
    try {
      if (rawResult.rows.length > 0) {
        const user = rawResult.rows[0];
        console.log('firstName:', user.firstName); // This should be undefined
        console.log('lastName:', user.lastName);   // This should be undefined
        console.log('isActive:', user.isActive);   // This should be undefined
      }
    } catch (error) {
      console.log('❌ CamelCase access error:', error.message);
    }
    
    // Test 3: Check what happens with Drizzle select all
    console.log('\n3. Testing Drizzle select all:');
    try {
      const drizzleResult = await db.execute(sql`
        SELECT * FROM users WHERE email = ${email} LIMIT 1
      `);
      
      if (drizzleResult.rows.length > 0) {
        const user = drizzleResult.rows[0];
        console.log('All columns:', Object.keys(user));
        console.log('Sample values:', {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          firstName: user.firstName,
          last_name: user.last_name,
          lastName: user.lastName,
          is_active: user.is_active,
          isActive: user.isActive
        });
      }
    } catch (error) {
      console.log('❌ Drizzle select error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

debugLogin();
