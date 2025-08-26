#!/usr/bin/env node

/**
 * Database Cleanup Script - Remove Safe Tables
 *
 * This script removes tables that have been identified as safe to remove
 * based on comprehensive analysis of the codebase.
 *
 * SAFE TO REMOVE TABLES:
 * - lesson_content_groups
 * - menu_items
 * - notifications
 * - page_images
 * - pages
 * - payment_history
 * - qliro_orders
 * - session_bookings
 * - session_types
 * - sessions
 * - supervisor_details
 * - transactions
 *
 * WARNING: This script will permanently delete data!
 * Always backup your database before running this script.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const TABLES_TO_REMOVE = [
  'lesson_content_groups',
  'menu_items',
  'notifications',
  'page_images',
  'pages',
  'payment_history',
  'qliro_orders',
  'session_bookings',
  'session_types',
  'sessions',
  'supervisor_details',
  'transactions'
];

// Database connection (uses environment variables)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Execute a query with error handling
 */
async function executeQuery(query, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`Query: ${query}`);

  try {
    const result = await pool.query(query);
    console.log(`✅ ${description} completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

/**
 * Check if table exists
 */
async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `, [tableName]);

  return result.rows[0].exists;
}

/**
 * Get foreign key constraints for a table
 */
async function getForeignKeys(tableName) {
  const result = await pool.query(`
    SELECT
      conname as constraint_name,
      conrelid::regclass as table_name,
      confrelid::regclass as referenced_table
    FROM pg_constraint
    WHERE conrelid = $1::regclass
    AND contype = 'f';
  `, [tableName]);

  return result.rows;
}

/**
 * Drop a table safely with foreign key handling
 */
async function dropTable(tableName) {
  console.log(`\n📋 Processing table: ${tableName}`);

  // Check if table exists
  const exists = await tableExists(tableName);
  if (!exists) {
    console.log(`ℹ️  Table ${tableName} does not exist, skipping...`);
    return;
  }

  try {
    // Get foreign keys that reference this table
    const foreignKeys = await getForeignKeys(tableName);
    if (foreignKeys.length > 0) {
      console.log(`⚠️  Found ${foreignKeys.length} foreign key constraints:`);
      foreignKeys.forEach(fk => {
        console.log(`   - ${fk.constraint_name}: ${fk.table_name} -> ${fk.referenced_table}`);
      });

      // Drop foreign key constraints first
      for (const fk of foreignKeys) {
        await executeQuery(
          `ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name};`,
          `Dropping foreign key constraint ${fk.constraint_name}`
        );
      }
    }

    // Drop the table
    await executeQuery(
      `DROP TABLE IF EXISTS ${tableName} CASCADE;`,
      `Dropping table ${tableName}`
    );

    console.log(`✅ Successfully removed table: ${tableName}`);

  } catch (error) {
    console.error(`❌ Failed to remove table ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Update schema files to remove table definitions
 */
function updateSchemaFiles() {
  console.log(`\n📝 Updating schema files...`);

  const schemaFiles = [
    'lib/db/schema.ts',
    'lib/db/schema/cms.ts',
    'lib/db/schema/invoice.ts',
    'lib/db/schema/session-types.ts',
    'lib/db/schema/sessions.ts',
    'lib/db/schema/session-bookings.ts',
    'lib/db/schema/email-templates.ts'
  ];

  // Tables to remove from each schema file
  const tablesByFile = {
    'lib/db/schema.ts': [
      'lesson_content_groups',
      'lesson_content_items',
      'menu_items',
      'notifications',
      'payment_history',
      'qliro_orders',
      'supervisor_details',
      'transactions',
      'user_reports'
    ],
    'lib/db/schema/cms.ts': [
      'pages',
      'page_images'
    ],
    'lib/db/schema/session-types.ts': [
      'sessionTypes'
    ],
    'lib/db/schema/sessions.ts': [
      'sessions'
    ],
    'lib/db/schema/session-bookings.ts': [
      'sessionBookings'
    ]
  };

  for (const [filePath, tables] of Object.entries(tablesByFile)) {
    if (fs.existsSync(filePath)) {
      console.log(`🔄 Processing ${filePath}...`);

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      for (const table of tables) {
        // Remove table export
        const tableExportRegex = new RegExp(`export const ${table} = pgTable\\('[^']+',[^}]*\\};`, 'gs');
        if (tableExportRegex.test(content)) {
          content = content.replace(tableExportRegex, '');
          modified = true;
          console.log(`   ✅ Removed table export: ${table}`);
        }

        // Remove from export statements
        const exportRegex = new RegExp(`,\\s*${table}`, 'g');
        if (exportRegex.test(content)) {
          content = content.replace(exportRegex, '');
          modified = true;
          console.log(`   ✅ Removed from exports: ${table}`);
        }

        // Remove standalone export
        const standaloneExportRegex = new RegExp(`export const ${table};?\\s*`, 'g');
        if (standaloneExportRegex.test(content)) {
          content = content.replace(standaloneExportRegex, '');
          modified = true;
          console.log(`   ✅ Removed standalone export: ${table}`);
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`   📝 Updated ${filePath}`);
      } else {
        console.log(`   ℹ️  No changes needed for ${filePath}`);
      }
    }
  }

  console.log(`✅ Schema files updated`);
}

/**
 * Create a backup of current schema
 */
function createSchemaBackup() {
  console.log(`\n💾 Creating schema backup...`);

  const schemaDir = 'lib/db/schema';
  const backupDir = 'lib/db/schema-backup';

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `schema-${timestamp}`);

  if (fs.existsSync(schemaDir)) {
    // Copy all schema files
    fs.cpSync(schemaDir, backupPath, { recursive: true });
    console.log(`✅ Schema backup created at: ${backupPath}`);
    return backupPath;
  }

  return null;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🗑️  DATABASE CLEANUP SCRIPT');
  console.log('==========================');
  console.log('This script will remove the following tables:');
  TABLES_TO_REMOVE.forEach(table => console.log(`  - ${table}`));
  console.log('\n⚠️  WARNING: This will permanently delete data!');
  console.log('Make sure you have a database backup before proceeding.\n');

  // Check if user wants to proceed
  const proceed = process.argv.includes('--yes') || process.argv.includes('-y');

  if (!proceed) {
    console.log('To proceed, run with --yes or -y flag:');
    console.log('node scripts/remove-safe-tables.js --yes');
    console.log('\nOr to just create a backup without removing tables:');
    console.log('node scripts/remove-safe-tables.js --backup-only');
    return;
  }

  // Handle backup-only mode
  if (process.argv.includes('--backup-only')) {
    createSchemaBackup();
    console.log('\n✅ Backup completed. No tables were removed.');
    return;
  }

  try {
    // Create backup first
    const backupPath = createSchemaBackup();

    console.log(`\n🔄 Connecting to database...`);
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      console.log(`\n🚀 Starting table removal process...`);

      // Drop tables
      for (const tableName of TABLES_TO_REMOVE) {
        await dropTable(tableName);
      }

      // Commit transaction
      await client.query('COMMIT');
      console.log(`\n✅ All tables successfully removed!`);

      // Update schema files
      updateSchemaFiles();

      console.log(`\n📋 Summary:`);
      console.log(`   - Removed ${TABLES_TO_REMOVE.length} tables`);
      console.log(`   - Schema backup: ${backupPath}`);
      console.log(`   - Schema files updated`);

      console.log(`\n🎉 Database cleanup completed successfully!`);
      console.log(`\nNext steps:`);
      console.log(`1. Run 'npm run db:generate' to update the database types`);
      console.log(`2. Test your application to ensure everything works`);
      console.log(`3. If needed, restore from backup: ${backupPath}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error(`\n❌ Script failed:`, error.message);
    console.log(`\n💡 If the script failed, you can:`);
    console.log(`1. Restore from the backup created`);
    console.log(`2. Check the error message above`);
    console.log(`3. Contact support if needed`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Cleanup Script - Remove Safe Tables

Usage:
  node scripts/remove-safe-tables.js [options]

Options:
  --yes, -y          Proceed with table removal (required)
  --backup-only      Only create backup, don't remove tables
  --help, -h         Show this help message

Safe to remove tables:
${TABLES_TO_REMOVE.map(table => `  - ${table}`).join('\n')}

WARNING: This will permanently delete data!
Always backup your database before running this script.
  `);
  process.exit(0);
}

// Run the script
main().catch(console.error);
