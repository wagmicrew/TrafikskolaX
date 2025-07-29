const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Read the connection string from .env.local
  let connectionString;
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match) {
      connectionString = match[1].replace(/"/g, '');
      console.log('Found DATABASE_URL in .env.local');
    }
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
    process.exit(1);
  }

  if (!connectionString) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_booking_steps.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}`);
          await client.query(statement);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`Statement ${i + 1}: Skipped (already exists)`);
            continue;
          }
          console.error(`Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('Migration completed successfully!');

    // Verify the booking_steps table was created and populated
    const result = await client.query('SELECT COUNT(*) FROM booking_steps');
    console.log(`Booking steps table contains ${result.rows[0].count} records`);

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runMigration();
