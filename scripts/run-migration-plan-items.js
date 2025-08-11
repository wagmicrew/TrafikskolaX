/*
  Run the migration for booking_plan_items table.
*/
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', '0011_add_booking_plan_items.sql');
  const sqlRaw = fs.readFileSync(migrationPath, 'utf8');

  // Split SQL into statements; keep it simple since our file is straightforward
  const statements = sqlRaw
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  try {
    await client.connect();
    console.log(`Connected. Executing ${statements.length} statements from 0011_add_booking_plan_items.sql`);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt + ';');
        console.log(`✓ (${i + 1}/${statements.length})`);
      } catch (err) {
        console.warn(`! Statement ${i + 1} warning: ${err.message}`);
      }
    }
    console.log('Migration completed.');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();


