#!/usr/bin/env node

/**
 * Database Table Removal - Dry Run Mode
 *
 * This script shows what would happen if you ran the actual removal script,
 * without making any actual changes to the database.
 */

const fs = require('fs');
const path = require('path');

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

/**
 * Analyze schema file for table references
 */
function analyzeSchemaFile(filePath, tables) {
  if (!fs.existsSync(filePath)) {
    return { file: filePath, status: 'not found', changes: [] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const changes = [];

  tables.forEach(table => {
    // Check for table export
    const tableExportRegex = new RegExp(`export const ${table} = pgTable\\('[^']+',[^}]*\\};`, 'gs');
    if (tableExportRegex.test(content)) {
      changes.push(`Remove table export: ${table}`);
    }

    // Check for export references
    const exportRegex = new RegExp(`,\\s*${table}`, 'g');
    if (exportRegex.test(content)) {
      changes.push(`Remove from exports: ${table}`);
    }

    // Check for standalone export
    const standaloneExportRegex = new RegExp(`export const ${table};?\\s*`, 'g');
    if (standaloneExportRegex.test(content)) {
      changes.push(`Remove standalone export: ${table}`);
    }
  });

  return {
    file: filePath,
    status: changes.length > 0 ? 'will be modified' : 'no changes needed',
    changes
  };
}

/**
 * Analyze all schema files
 */
function analyzeSchemaChanges() {
  console.log('\n📝 SCHEMA FILE CHANGES');
  console.log('='.repeat(50));

  const schemaFiles = {
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

  const results = [];

  for (const [filePath, tables] of Object.entries(schemaFiles)) {
    const result = analyzeSchemaFile(filePath, tables);
    results.push(result);

    console.log(`\n📄 ${filePath}`);
    console.log(`Status: ${result.status}`);

    if (result.changes.length > 0) {
      result.changes.forEach(change => {
        console.log(`   • ${change}`);
      });
    } else {
      console.log(`   ℹ️  No changes needed`);
    }
  }

  return results;
}

/**
 * Show database operations
 */
function showDatabaseOperations() {
  console.log('\n🗃️  DATABASE OPERATIONS');
  console.log('='.repeat(50));

  console.log('\n📋 Tables that will be dropped:');
  TABLES_TO_REMOVE.forEach(table => {
    console.log(`   • DROP TABLE IF EXISTS ${table} CASCADE;`);
  });

  console.log('\n⚠️  Foreign key constraints that will be handled:');
  console.log(`   • All foreign key constraints will be dropped automatically due to CASCADE`);

  console.log('\n📊 Data impact:');
  console.log(`   • All data in these tables will be permanently deleted`);
  console.log(`   • Foreign key relationships will be maintained automatically`);
}

/**
 * Show backup strategy
 */
function showBackupStrategy() {
  console.log('\n💾 BACKUP STRATEGY');
  console.log('='.repeat(50));

  console.log('\n🔄 Automatic backup creation:');
  console.log(`   • Schema files will be backed up to: lib/db/schema-backup/`);
  console.log(`   • Timestamped backup directory will be created`);

  console.log('\n📁 Files that will be backed up:');
  console.log(`   • lib/db/schema.ts`);
  console.log(`   • lib/db/schema/cms.ts`);
  console.log(`   • lib/db/schema/invoice.ts`);
  console.log(`   • lib/db/schema/session-types.ts`);
  console.log(`   • lib/db/schema/sessions.ts`);
  console.log(`   • lib/db/schema/session-bookings.ts`);
  console.log(`   • lib/db/schema/email-templates.ts`);

  console.log('\n💡 Manual backup recommendation:');
  console.log(`   • Create a database dump before running the actual removal script`);
  console.log(`   • Command: pg_dump $DATABASE_URL > backup.sql`);
}

/**
 * Show next steps
 */
function showNextSteps() {
  console.log('\n🎯 NEXT STEPS');
  console.log('='.repeat(50));

  console.log('\n1️⃣  Verification (recommended):');
  console.log(`   • Run: node scripts/verify-table-removal.js`);
  console.log(`   • This will check actual database state and row counts`);

  console.log('\n2️⃣  Backup (mandatory):');
  console.log(`   • Create database backup: pg_dump $DATABASE_URL > backup.sql`);
  console.log(`   • The removal script also creates automatic schema backups`);

  console.log('\n3️⃣  Execute removal:');
  console.log(`   • Run: node scripts/remove-safe-tables.js --yes`);
  console.log(`   • This will perform the actual removal`);

  console.log('\n4️⃣  Post-removal:');
  console.log(`   • Run: npm run db:generate`);
  console.log(`   • Update any TypeScript types`);
  console.log(`   • Test your application thoroughly`);

  console.log('\n5️⃣  Rollback (if needed):');
  console.log(`   • Restore from database backup if issues occur`);
  console.log(`   • Schema files can be restored from lib/db/schema-backup/`);
}

/**
 * Show safety warnings
 */
function showSafetyWarnings() {
  console.log('\n⚠️  SAFETY WARNINGS');
  console.log('='.repeat(50));

  console.log('\n🚨 CRITICAL WARNINGS:');
  console.log(`   • This operation will PERMANENTLY DELETE data`);
  console.log(`   • All data in the removed tables will be lost forever`);
  console.log(`   • Foreign key relationships will be automatically handled`);
  console.log(`   • Schema files will be modified and backed up`);

  console.log('\n✅ SAFETY MEASURES:');
  console.log(`   • Automatic schema backup before any changes`);
  console.log(`   • Transaction-based removal (rollback on failure)`);
  console.log(`   • CASCADE deletion to handle dependencies`);
  console.log(`   • Comprehensive error handling`);

  console.log('\n🔍 VERIFICATION:');
  console.log(`   • Run dry-run first to see what would happen`);
  console.log(`   • Use verification script to check actual database state`);
  console.log(`   • Review all changes before proceeding`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 DATABASE TABLE REMOVAL - DRY RUN MODE');
  console.log('==========================================');
  console.log('This script shows what WOULD happen - NO CHANGES MADE');
  console.log('\nTables that will be removed:');
  TABLES_TO_REMOVE.forEach(table => console.log(`  • ${table}`));

  // Analyze schema changes
  const schemaResults = analyzeSchemaChanges();

  // Show database operations
  showDatabaseOperations();

  // Show backup strategy
  showBackupStrategy();

  // Show safety warnings
  showSafetyWarnings();

  // Show next steps
  showNextSteps();

  console.log(`\n📋 SUMMARY`);
  console.log('='.repeat(50));
  console.log(`Tables to remove: ${TABLES_TO_REMOVE.length}`);
  console.log(`Schema files to modify: ${schemaResults.filter(r => r.changes.length > 0).length}`);
  console.log(`\n✅ Ready to proceed with actual removal script when you are!`);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Table Removal - Dry Run Mode

Usage:
  node scripts/dry-run-table-removal.js

This script will:
1. Analyze schema files for table references
2. Show what database operations would be performed
3. Explain the backup strategy
4. Provide safety warnings and next steps

No changes are made to the database or files - this is read-only.

Tables that would be removed:
${TABLES_TO_CHECK.map(table => `  - ${table}`).join('\n')}

To perform actual removal:
  node scripts/remove-safe-tables.js --yes

To verify current database state:
  node scripts/verify-table-removal.js
  `);
  process.exit(0);
}

// Run the script
main();
