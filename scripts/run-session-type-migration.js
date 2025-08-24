#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running session type support migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'drizzle', 'migrations', '2025-01-27_add_session_type_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement breakpoints and execute each part
    const statements = migrationSQL.split('--> statement-breakpoint').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await client.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n📊 Verifying migration results...');
    
    // Check if session_type column exists
    const sessionTypeCheck = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'teori_sessions' AND column_name = 'session_type'
    `);
    
    if (sessionTypeCheck.rows.length > 0) {
      console.log('✅ session_type column added to teori_sessions');
    }
    
    // Check if price column exists
    const priceCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teori_sessions' AND column_name = 'price'
    `);
    
    if (priceCheck.rows.length > 0) {
      console.log('✅ price column added to teori_sessions');
    }
    
    // Check lesson types
    const lessonTypesCount = await client.query('SELECT COUNT(*) FROM teori_lesson_types');
    console.log(`✅ Teori lesson types: ${lessonTypesCount.rows[0].count}`);
    
    // Check sessions
    const sessionsCount = await client.query('SELECT COUNT(*) FROM teori_sessions');
    console.log(`✅ Teori sessions: ${sessionsCount.rows[0].count}`);
    
    console.log('\n🎉 Migration verification complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
