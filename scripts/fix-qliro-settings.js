#!/usr/bin/env node

/**
 * Qliro Settings Diagnostic and Fix Script
 * This script checks and fixes Qliro payment settings in the database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('🔍 Checking Qliro settings...\n');

    // Get current settings
    const result = await pool.query(
      `SELECT key, value, category, description 
       FROM site_settings 
       WHERE category = 'payment' AND key LIKE '%qliro%' 
       ORDER BY key`
    );

    console.log('📋 Current Qliro Settings:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (result.rows.length === 0) {
      console.log('❌ No Qliro settings found in database');
    } else {
      result.rows.forEach(row => {
        const maskedValue = row.key.includes('key') || row.key.includes('secret') 
          ? (row.value ? '***HIDDEN***' : '(empty)') 
          : row.value || '(empty)';
        console.log(`${row.key}: ${maskedValue}`);
      });
    }

    console.log('\n🔧 Setting up default Qliro settings...\n');

    // Default Qliro settings for sandbox testing
    const defaultSettings = [
      { key: 'qliro_enabled', value: 'true', description: 'Enable Qliro sandbox environment' },
      { key: 'qliro_api_key', value: 'MerchantApiKey', description: 'Qliro sandbox API key' },
      { key: 'qliro_merchant_id', value: '100', description: 'Qliro sandbox merchant ID' },
      { key: 'qliro_dev_api_url', value: 'https://playground.qliro.com', description: 'Qliro sandbox API URL' },
      { key: 'qliro_prod_enabled', value: 'false', description: 'Enable Qliro production environment' },
      { key: 'qliro_prod_api_key', value: '', description: 'Qliro production API key' },
      { key: 'qliro_prod_merchant_id', value: '', description: 'Qliro production merchant ID' },
      { key: 'qliro_prod_api_url', value: 'https://api.qliro.com', description: 'Qliro production API URL' },
      { key: 'qliro_webhook_secret', value: '', description: 'Qliro webhook secret for signature verification' },
      { key: 'qliro_test_passed', value: 'false', description: 'Whether Qliro test has passed' },
      { key: 'qliro_last_test_date', value: '', description: 'Last Qliro test date' }
    ];

    // Insert or update settings
    for (const setting of defaultSettings) {
      const { key, value, description } = setting;
      
      await pool.query(`
        INSERT INTO site_settings (key, value, category, description, is_env, created_at, updated_at)
        VALUES ($1, $2, 'payment', $3, $4, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE SET
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [key, value, description, key.includes('key') || key.includes('secret')]);

      console.log(`✅ ${key}: configured`);
    }

    console.log('\n🎯 Testing database connection to Qliro settings...\n');

    // Test reading the settings like the application would
    const testResult = await pool.query(`
      SELECT key, value 
      FROM site_settings 
      WHERE category = 'payment' AND key IN ('qliro_enabled', 'qliro_api_key', 'qliro_merchant_id')
    `);

    const settingsMap = testResult.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    console.log('🧪 Test Results:');
    console.log(`- Qliro Enabled: ${settingsMap.qliro_enabled === 'true' ? '✅ Yes' : '❌ No'}`);
    console.log(`- API Key Set: ${settingsMap.qliro_api_key ? '✅ Yes' : '❌ No'}`);
    console.log(`- Merchant ID Set: ${settingsMap.qliro_merchant_id ? '✅ Yes' : '❌ No'}`);

    const isConfigured = settingsMap.qliro_enabled === 'true' && 
                         settingsMap.qliro_api_key && 
                         settingsMap.qliro_merchant_id;

    console.log(`\n${isConfigured ? '✅' : '❌'} Qliro Configuration: ${isConfigured ? 'READY' : 'INCOMPLETE'}\n`);

    if (isConfigured) {
      console.log('🎉 Qliro is now configured for sandbox testing!');
      console.log('   Note: There is no mock fallback. If the API is unreachable, Qliro will be marked unavailable.');
    } else {
      console.log('⚠️  Please check your database settings or run this script again.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
