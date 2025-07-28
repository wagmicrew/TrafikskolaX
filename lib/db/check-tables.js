const { Client } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '..', '.env.local');
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

    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nExisting tables:');
    tablesResult.rows.forEach(row => console.log(`- ${row.table_name}`));

    // Check if bookings table exists
    const bookingsExists = tablesResult.rows.some(row => row.table_name === 'bookings');
    if (bookingsExists) {
      console.log('\nBookings table exists. Checking structure...');
      
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'bookings'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nBookings table columns:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Check indexes
      const indexesResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'bookings';
      `);
      
      console.log('\nBookings table indexes:');
      indexesResult.rows.forEach(row => {
        console.log(`- ${row.indexname}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTables();
