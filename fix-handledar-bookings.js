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

async function fixHandledarBookingsTable() {
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Adding missing columns to handledar_bookings table...');

    // Add missing columns
    const alterQueries = [
      `ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS price decimal(10,2);`,
      `ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS payment_status varchar(50) DEFAULT 'pending';`,
      `ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS payment_method varchar(50);`,
      `ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS swish_uuid varchar(255);`,
      `ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS booked_by uuid REFERENCES users(id);`,
      `ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;`,
      `ALTER TABLE handledar_bookings ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();`
    ];

    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log('Executed:', query);
      } catch (error) {
        console.error('Error executing:', query, error.message);
      }
    }

    // Also update the supervisor_name to be NOT NULL as per schema
    await client.query(`ALTER TABLE handledar_bookings ALTER COLUMN supervisor_name SET NOT NULL;`);
    console.log('Set supervisor_name to NOT NULL');

    console.log('Migration completed successfully!');

    // Verify the changes
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'handledar_bookings'
      ORDER BY ordinal_position
    `);

    console.log('Updated handledar_bookings columns:', columnsResult.rows);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

fixHandledarBookingsTable();
