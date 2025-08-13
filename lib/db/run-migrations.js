/* eslint-disable @typescript-eslint/no-require-imports */
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

async function runMigrations() {
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_booking_system.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons but be careful with functions
    const statements = migration
      .split(/;(?=\s*(?:CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|GRANT|REVOKE|TRUNCATE|COMMENT|BEGIN|COMMIT|ROLLBACK|SET|SHOW|USE|ANALYZE|EXPLAIN|VACUUM|COPY|DO|CALL|VALUES|TABLE|WITH|SELECT|$))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Running ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await client.query(statement + ';');
          console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (err) {
          console.error(`✗ Error in statement ${i + 1}:`, err.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
          throw err;
        }
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
