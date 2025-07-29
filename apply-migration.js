const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(dbUrl);
  const migrationPath = './lib/db/migrations/add-missing-columns.sql';

  try {
    console.log('Reading migration file...');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await sql`${migration}`;

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
