require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  const queries = [
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10, 2)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS inskriven_date TIMESTAMP',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS car_id UUID',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS feedback_ready BOOLEAN DEFAULT false',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100)',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP',
  ];

  try {
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`Running query ${i + 1}/${queries.length}: ${query}`);
      try {
        await sql`${query}`;
        console.log('✓ Success');
      } catch (err) {
        console.log(`⚠ Expected error (column might exist): ${err.message}`);
      }
    }

    console.log('\nColumn additions completed');
  } catch (err) {
    console.error('Critical error:', err);
    process.exit(1);
  }
})();
