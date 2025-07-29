const { neon } = require('@neondatabase/serverless');

// Hardcode the connection string for testing
const DATABASE_URL = 'postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
console.log('Testing connection to Neon database...');

async function testConnection() {
  try {
    const sql = neon(DATABASE_URL);
    const result = await sql`SELECT version()`;
    console.log('Connection successful!');
    console.log('PostgreSQL version:', result[0].version);
  } catch (error) {
    console.error('Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
