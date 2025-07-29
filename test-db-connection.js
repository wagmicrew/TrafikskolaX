const { neon } = require('@neondatabase/serverless');

// Direct database URL for testing
const DATABASE_URL = "postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('Testing NEON Database connection...');

async function testConnection() {
  try {
    const sql = neon(DATABASE_URL);
    const result = await sql`SELECT version(), current_database(), current_user`;
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', result[0].version);
    console.log('Database:', result[0].current_database);
    console.log('User:', result[0].current_user);
    
    // Test a simple query to check if we can access tables
    try {
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
        LIMIT 5
      `;
      console.log('✅ Database tables accessible');
      console.log('Available tables:', tableCheck.map(t => t.table_name));
    } catch (tableError) {
      console.log('⚠️  Could not access tables:', tableError.message);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
