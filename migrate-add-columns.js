const { neon } = require('@neondatabase/serverless');

async function addMissingColumns() {
  const connectionString = 'postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require\u0026channel_binding=require';
  const sql = neon(connectionString);

  try {
    // Add the is_completed column if it doesn't exist
    console.log('Checking for is_completed column...');
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'is_completed'
    `;

    if(result.length === 0) {
      console.log('Adding is_completed column to bookings...');
      await sql`
        ALTER TABLE bookings
        ADD COLUMN is_completed BOOLEAN DEFAULT FALSE
      `;
      console.log('is_completed column added successfully.');
    } else {
      console.log('is_completed column already exists.');
    }

  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

addMissingColumns();

