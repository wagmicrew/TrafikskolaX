const { Client } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

async function checkTables() {
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if handledar_sessions table exists
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'handledar%'
    `);

    console.log('Found handledar tables:', tablesResult.rows);

    // Check columns for handledar_sessions table
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'handledar_sessions'
      ORDER BY ordinal_position
    `);

    console.log('Handledar sessions columns:', columnsResult.rows);

    // Try to insert a test session
    try {
      const insertResult = await client.query(`
        INSERT INTO handledar_sessions (title, description, date, start_time, end_time, price_per_participant)
        VALUES ('Test Session', 'Test Description', '2025-08-01', '10:00', '12:00', 500)
        RETURNING id, title
      `);
      console.log('Test insert successful:', insertResult.rows[0]);
      
      // Clean up test data
      await client.query('DELETE FROM handledar_sessions WHERE title = $1', ['Test Session']);
      console.log('Test data cleaned up');
    } catch (insertError) {
      console.error('Insert test failed:', insertError.message);
    }

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await client.end();
  }
}

checkTables();
