#!/usr/bin/env node

/**
 * Test Database Connection
 *
 * This script tests the database connection and shows connection details
 */

require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('🔍 Testing Database Connection');
  console.log('==============================\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL is required but not set!');
    console.log('');
    console.log('🔧 To fix this:');
    console.log('1. Create a .env.local file in your project root');
    console.log('2. Add your DATABASE_URL:');
    console.log('   DATABASE_URL="postgresql://username:password@host:port/database"');
    console.log('');
    console.log('For Neon database, get the connection string from:');
    console.log('https://console.neon.tech/app/projects');
    console.log('');
    process.exit(1);
  }

  try {
    console.log('🔄 Attempting to connect to database...');
    const sql = neon(process.env.DATABASE_URL);

    // Test basic connection
    console.log('📡 Testing basic connectivity...');
    const result = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Basic connection successful!');
    console.log('🕐 Database time:', result[0].current_time);
    console.log('');

    // Test table access
    console.log('📊 Testing table access...');
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`✅ Found ${tablesResult.length} tables in database:`);
    tablesResult.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    console.log('');

    // Test specific tables we're interested in
    const tablesToCheck = [
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

    console.log('🔍 Checking tables marked for removal:');
    for (const tableName of tablesToCheck) {
      try {
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        const count = countResult[0].count;
        console.log(`   ${tableName}: ${count} rows`);
      } catch (error) {
        console.log(`   ${tableName}: Table does not exist`);
      }
    }

    console.log('');
    console.log('🎉 Database connection test completed successfully!');
    console.log('');
    console.log('✅ You can now run the table removal scripts:');
    console.log('   node scripts/verify-table-removal.js');
    console.log('   node scripts/dry-run-table-removal.js');

  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log('Error:', error.message);
    console.log('');

    if (error.message.includes('authentication failed')) {
      console.log('🔧 Possible solutions:');
      console.log('1. Check your DATABASE_URL credentials');
      console.log('2. Make sure your Neon database is active');
      console.log('3. Verify your IP is allowed in Neon console');
    } else if (error.message.includes('does not exist')) {
      console.log('🔧 Possible solutions:');
      console.log('1. Check your database name in DATABASE_URL');
      console.log('2. Make sure the database was created in Neon');
    } else {
      console.log('🔧 General troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify DATABASE_URL format');
      console.log('3. Contact Neon support if issues persist');
    }

    process.exit(1);
  }
}

// Run the test
testConnection();
