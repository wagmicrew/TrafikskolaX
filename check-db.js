require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  try {
    // Check which tables exist
    console.log('Checking existing tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Existing tables:');
    tables.forEach(table => console.log(`- ${table.table_name}`));

    // Check columns in users table
    console.log('\nColumns in users table:');
    const userColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY column_name;
    `;
    userColumns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));

    // Check columns in bookings table
    console.log('\nColumns in bookings table:');
    const bookingColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND table_schema = 'public'
      ORDER BY column_name;
    `;
    bookingColumns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));

  } catch (err) {
    console.error('Database check failed:', err);
    process.exit(1);
  }
})();
