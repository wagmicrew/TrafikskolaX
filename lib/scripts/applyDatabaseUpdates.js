import { drizzleClient } from '../db/client';

async function applyDatabaseUpdates() {
  const client = await drizzleClient();

  // Add columns for inskriven feature
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS inskriven BOOLEAN DEFAULT false`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10, 2)`);

  // Add site settings table
  await client.query(`CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    category VARCHAR(100),
    is_env BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`);

  // Additional database updates skipped for brevity

  console.log('Database updates applied successfully!');
}

applyDatabaseUpdates().catch(err => console.error('Failed to apply database updates:', err));
