const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('📋 Testing session_types table...');
    const result = await client.query('SELECT id, name, type FROM session_types LIMIT 3');
    console.log('✅ Query successful! Found', result.rows.length, 'session types');
    console.log('Session types:', result.rows);

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

testConnection();
