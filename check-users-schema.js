// Check users table schema
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');

// Direct database URL for testing
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('🔍 Checking users table schema...');

async function checkUsersSchema() {
  try {
    // Create NEON connection
    const neonSql = neon(DATABASE_URL);
    
    // Create Drizzle instance
    const db = drizzle(neonSql);
    
    console.log('✅ Connected to database');
    
    // Check users table schema
    const schemaResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table schema:');
    schemaResult.rows.forEach(column => {
      console.log(`   ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${column.column_default ? `DEFAULT ${column.column_default}` : ''}`);
    });
    
    // Try a simple select to see what happens
    console.log('\n🧪 Testing simple select...');
    try {
      const testResult = await db.execute(sql`SELECT id, email, first_name, last_name, role FROM users LIMIT 1`);
      console.log('✅ Simple select works');
      if (testResult.rows.length > 0) {
        console.log('Sample user:', testResult.rows[0]);
      }
    } catch (error) {
      console.log('❌ Simple select failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

checkUsersSchema();
