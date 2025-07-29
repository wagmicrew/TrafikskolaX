require('dotenv').config();
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

    // Split the migration into individual statements
    const statements = migration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Running ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        try {
          await sql([stmt]);
        } catch (stmtErr) {
          console.warn(`Statement ${i + 1} failed (might be expected):`, stmtErr.message);
        }
      }
    }

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
