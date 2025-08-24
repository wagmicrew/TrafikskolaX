const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createBookingSupervisorTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create table for storing supervisor details for regular bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_supervisor_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        supervisor_name VARCHAR(255) NOT NULL,
        supervisor_email VARCHAR(255),
        supervisor_phone VARCHAR(50),
        supervisor_personal_number VARCHAR(255), -- Encrypted, so longer field
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Add index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_supervisor_details_booking_id
      ON booking_supervisor_details(booking_id)
    `);

    // Add comment
    await client.query(`
      COMMENT ON TABLE booking_supervisor_details IS 'Stores supervisor details for regular bookings (non-handledar sessions)'
    `);

    console.log('✅ Successfully created booking_supervisor_details table');

  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createBookingSupervisorTable();
