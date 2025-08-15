const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();

async function runMigrations() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Running Qliro migrations...');
    
    // Migration 1: Create table
    const migration1 = fs.readFileSync('./drizzle/0011_create_qliro_orders_table.sql', 'utf8');
    await sql(migration1);
    console.log('✓ Migration 1: Created qliro_orders table');
    
    // Migration 2: Add foreign keys
    const migration2 = fs.readFileSync('./drizzle/0012_add_qliro_foreign_keys.sql', 'utf8');
    await sql(migration2);
    console.log('✓ Migration 2: Added foreign key constraints');
    
    // Migration 3: Add indexes
    const migration3 = fs.readFileSync('./drizzle/0013_add_qliro_indexes.sql', 'utf8');
    await sql(migration3);
    console.log('✓ Migration 3: Added indexes');
    
    console.log('All Qliro migrations completed successfully!');
    
    // Verify table exists
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'qliro_orders'`;
    if (result.length > 0) {
      console.log('✓ Table verification: qliro_orders table exists');
    } else {
      console.log('✗ Table verification: qliro_orders table not found');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
