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

  // Lesson content tables
  await client.query(`CREATE TABLE IF NOT EXISTS lesson_content_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`);

  await client.query(`CREATE TABLE IF NOT EXISTS lesson_content_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES lesson_content_groups(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    duration_minutes integer,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`);

  console.log('Database updates applied successfully!');
}

applyDatabaseUpdates().catch(err => console.error('Failed to apply database updates:', err));
