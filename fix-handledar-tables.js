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

async function fixTables() {
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add missing columns to handledar_sessions
    const alterStatements = [
      'ALTER TABLE handledar_sessions ADD COLUMN IF NOT EXISTS title varchar(255) NOT NULL DEFAULT \'Untitled Session\'',
      'ALTER TABLE handledar_sessions ADD COLUMN IF NOT EXISTS description text',
      'ALTER TABLE handledar_sessions ADD COLUMN IF NOT EXISTS price_per_participant decimal(10,2) NOT NULL DEFAULT 0',
      // Remove the default after adding the column
      'ALTER TABLE handledar_sessions ALTER COLUMN title DROP DEFAULT'
    ];

    for (let i = 0; i < alterStatements.length; i++) {
      const statement = alterStatements[i];
      try {
        await client.query(statement);
        console.log(`✓ Statement ${i + 1}/${alterStatements.length} executed successfully`);
      } catch (err) {
        console.error(`✗ Error in statement ${i + 1}:`, err.message);
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    // Verify the columns now exist
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'handledar_sessions'
      ORDER BY ordinal_position
    `);

    console.log('Updated handledar sessions columns:', columnsResult.rows);

    // Test insert again
    try {
      const insertResult = await client.query(`
        INSERT INTO handledar_sessions (title, description, date, start_time, end_time, price_per_participant)
        VALUES ('Test Session', 'Test Description', '2025-08-01', '10:00', '12:00', 500)
        RETURNING id, title
      `);
      console.log('Test insert successful:', insertResult.rows[0]);
      
      // Clean up test data
      await client.query('DELETE FROM handledar_sessions WHERE title = $1', ['Test Session']);
      console.log('Test data cleaned up');
    } catch (insertError) {
      console.error('Insert test failed:', insertError.message);
    }

    console.log('Tables fixed successfully!');
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixTables();
