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

async function addEmailPreferences() {
  const client = new Client({
    connectionString: envVars.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Adding email preferences column to users table...');

    // Add email preferences column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS send_internal_messages_to_email boolean DEFAULT false;
    `);

    console.log('Email preferences column added successfully!');

    // Verify the change
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'send_internal_messages_to_email'
    `);

    console.log('Column verification:', result.rows);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

addEmailPreferences();
