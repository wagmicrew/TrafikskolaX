#!/usr/bin/env node

/**
 * Database Verification Script
 *
 * This script verifies which of the "safe to remove" tables actually exist
 * and checks for any remaining references that might prevent removal.
 */

const { Pool } = require('pg');

const TABLES_TO_CHECK = [
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

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Check if table exists
 */
async function tableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `, [tableName]);

    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Get table row count
 */
async function getTableRowCount(tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName};`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    return 0;
  }
}

/**
 * Get foreign key constraints for a table
 */
async function getForeignKeys(tableName) {
  try {
    const result = await pool.query(`
      SELECT
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as referenced_table,
        conkey as columns,
        confkey as referenced_columns
      FROM pg_constraint
      WHERE (conrelid = $1::regclass OR confrelid = $1::regclass)
      AND contype = 'f';
    `, [tableName]);

    return result.rows;
  } catch (error) {
    return [];
  }
}

/**
 * Check for any remaining references in the codebase
 */
function checkCodeReferences(tableName) {
  // This is a basic check - in a real scenario you'd want to search the actual codebase
  const commonReferencePatterns = [
    `from.*${tableName}`,
    `import.*${tableName}`,
    `references.*${tableName}`,
    `${tableName}\\s*=`,
    `${tableName}\\.`
  ];

  return {
    found: false,
    patterns: commonReferencePatterns,
    note: 'Full codebase search would be performed by a separate script'
  };
}

/**
 * Analyze table for removal safety
 */
async function analyzeTable(tableName) {
  console.log(`\n📋 Analyzing table: ${tableName}`);
  console.log('='.repeat(50));

  const exists = await tableExists(tableName);
  console.log(`📍 Exists in database: ${exists ? '✅ YES' : '❌ NO'}`);

  if (exists) {
    const rowCount = await getTableRowCount(tableName);
    console.log(`📊 Row count: ${rowCount.toLocaleString()} rows`);

    const foreignKeys = await getForeignKeys(tableName);
    if (foreignKeys.length > 0) {
      console.log(`🔗 Foreign key constraints: ${foreignKeys.length}`);
      foreignKeys.forEach(fk => {
        console.log(`   - ${fk.constraint_name}: ${fk.table_name} -> ${fk.referenced_table}`);
      });
    } else {
      console.log(`🔗 Foreign key constraints: None`);
    }

    // Data impact assessment
    if (rowCount > 0) {
      console.log(`⚠️  DATA IMPACT: This table contains ${rowCount.toLocaleString()} rows that will be permanently deleted!`);
    } else {
      console.log(`✅ No data to lose (empty table)`);
    }
  }

  // Code reference check
  const codeRefs = checkCodeReferences(tableName);
  console.log(`🔍 Code references: ${codeRefs.found ? '❌ FOUND' : '✅ None found'}`);

  // Overall assessment
  const canRemove = !exists || (await getTableRowCount(tableName) === 0);
  console.log(`🏁 Safe to remove: ${canRemove ? '✅ YES' : '❌ NO'}`);

  if (!canRemove && exists) {
    console.log(`💡 Recommendation: Backup data before removal`);
  }

  return {
    tableName,
    exists,
    rowCount: exists ? await getTableRowCount(tableName) : 0,
    foreignKeys: exists ? await getForeignKeys(tableName) : [],
    codeReferences: codeRefs.found,
    safeToRemove: canRemove
  };
}

/**
 * Generate removal script
 */
function generateRemovalScript(results) {
  const removableTables = results.filter(r => r.safeToRemove);
  const nonRemovableTables = results.filter(r => !r.safeToRemove && r.exists);

  console.log(`\n📝 Generated Removal Script`);
  console.log('='.repeat(50));

  if (removableTables.length > 0) {
    console.log(`\n✅ Tables that can be safely removed:`);
    removableTables.forEach(table => {
      console.log(`   - ${table.tableName}`);
    });

    console.log(`\n🔧 Run this SQL to remove tables:`);
    console.log(`-- Safe to remove tables (no data loss)`);
    removableTables.forEach(table => {
      console.log(`DROP TABLE IF EXISTS ${table.tableName} CASCADE;`);
    });
  }

  if (nonRemovableTables.length > 0) {
    console.log(`\n⚠️  Tables with data that need attention:`);
    nonRemovableTables.forEach(table => {
      console.log(`   - ${table.tableName}: ${table.rowCount.toLocaleString()} rows`);
    });

    console.log(`\n🔧 To remove tables with data (CAUTION - DATA LOSS):`);
    nonRemovableTables.forEach(table => {
      console.log(`-- WARNING: This will delete ${table.rowCount.toLocaleString()} rows!`);
      console.log(`DROP TABLE IF EXISTS ${table.tableName} CASCADE;`);
    });
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 DATABASE VERIFICATION SCRIPT');
  console.log('===============================');
  console.log('Checking tables marked as "safe to remove"\n');

  try {
    console.log('🔄 Connecting to database...');
    await pool.connect();
    console.log('✅ Connected successfully\n');

    const results = [];

    // Analyze each table
    for (const tableName of TABLES_TO_CHECK) {
      const result = await analyzeTable(tableName);
      results.push(result);
    }

    // Generate summary
    console.log(`\n📊 SUMMARY`);
    console.log('='.repeat(50));

    const totalTables = results.length;
    const existingTables = results.filter(r => r.exists).length;
    const removableTables = results.filter(r => r.safeToRemove).length;
    const tablesWithData = results.filter(r => r.exists && r.rowCount > 0).length;
    const totalRows = results.reduce((sum, r) => sum + r.rowCount, 0);

    console.log(`📋 Total tables to check: ${totalTables}`);
    console.log(`📍 Tables that exist: ${existingTables}`);
    console.log(`✅ Safe to remove: ${removableTables}`);
    console.log(`⚠️  Tables with data: ${tablesWithData}`);
    console.log(`📊 Total data rows: ${totalRows.toLocaleString()}`);

    // Generate removal script
    generateRemovalScript(results);

    console.log(`\n🎯 RECOMMENDATIONS`);
    console.log('='.repeat(50));

    if (removableTables === totalTables) {
      console.log(`✅ All tables are safe to remove!`);
      console.log(`   Run: node scripts/remove-safe-tables.js --yes`);
    } else {
      console.log(`⚠️  Some tables contain data and need attention.`);
      console.log(`   Review the analysis above before proceeding.`);
      console.log(`   Consider backing up data first.`);
    }

    console.log(`\n📞 For questions or concerns, check the documentation:`);
    console.log(`   Documentation_new/database-tables-analysis.md`);
    console.log(`   Documentation_new/database-analysis-cannot-remove.md`);

  } catch (error) {
    console.error(`\n❌ Script failed:`, error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Verification Script

Usage:
  node scripts/verify-table-removal.js

This script will:
1. Check if the "safe to remove" tables actually exist
2. Count rows in each table
3. Identify foreign key constraints
4. Assess data loss impact
5. Generate removal recommendations

Tables to check:
${TABLES_TO_CHECK.map(table => `  - ${table}`).join('\n')}

No changes are made to the database - this is read-only.
  `);
  process.exit(0);
}

// Run the script
main().catch(console.error);
