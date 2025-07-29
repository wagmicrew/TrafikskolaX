// Test Drizzle ORM connection to NEON Database
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');

// Direct database URL for testing
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('🔍 Testing Drizzle ORM with NEON Database...');

async function testDrizzleConnection() {
  try {
    // Create NEON connection
    const neonSql = neon(DATABASE_URL);
    
    // Create Drizzle instance
    const db = drizzle(neonSql);
    
    console.log('✅ Drizzle ORM initialized successfully');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT version(), current_database(), current_user`);
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version);
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    
    // Test table access
    try {
      const tableCheck = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
        LIMIT 10
      `);
      console.log('✅ Database tables accessible via Drizzle');
      console.log('Available tables:', tableCheck.rows.map(t => t.table_name));
      
      // Check if users table exists
      const usersTableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      console.log('✅ Users table exists:', usersTableCheck.rows[0].exists);
      
    } catch (tableError) {
      console.log('⚠️  Could not access tables:', tableError.message);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testDrizzleConnection();
