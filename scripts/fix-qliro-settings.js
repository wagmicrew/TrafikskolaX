#!/usr/bin/env node

/**
 * Qliro Settings Diagnostic and Fix Script
 * This script checks and fixes Qliro payment settings in the database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

async function main() {
  try {
    console.log('🔍 Checking Qliro settings...\n');
    console.log('🔌 Connecting to database...');
    // Ensure we don't hang forever on queries
    await pool.query('SET statement_timeout = 10000');
    await pool.query('SELECT 1 as ok');
    console.log('✅ Database connection OK');

    // Get current settings
    const result = await pool.query(
      `SELECT key, value, category, description 
       FROM site_settings 
       WHERE key LIKE 'qliro_%' 
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

    // Pull from environment if present; otherwise leave empty defaults (no mock data)
    const envApiKey = process.env.QLIRO_API_KEY || process.env.QLIRO_MERCHANT_ID || '';
    const envApiSecret = process.env.QLIRO_API_SECRET || process.env.QLIRO_SHARED_SECRET || '';
    const envProdApiKey = process.env.QLIRO_PROD_API_KEY || '';
    const envProdApiSecret = process.env.QLIRO_PROD_API_SECRET || process.env.QLIRO_PROD_SHARED_SECRET || '';
    const webhookSecret = process.env.QLIRO_WEBHOOK_SECRET || '';

    // Default Qliro settings (values are empty unless provided by env)
    const defaultSettings = [
      { key: 'qliro_enabled', value: 'false', description: 'Enable Qliro payments' },
      { key: 'qliro_use_prod_env', value: 'false', description: 'Use production environment if true' },
      { key: 'qliro_environment', value: '', description: 'Explicit environment override: production or sandbox' },

      // Sandbox credentials
      { key: 'qliro_api_key', value: envApiKey, description: 'Qliro sandbox API key' },
      { key: 'qliro_secret', value: envApiSecret, description: 'Qliro sandbox API shared secret' },
      { key: 'qliro_api_secret', value: envApiSecret, description: 'Qliro sandbox API secret (alias)' },
      { key: 'qliro_shared_secret', value: envApiSecret, description: 'Qliro shared secret (alias)' },
      { key: 'qliro_dev_api_key', value: '', description: 'Optional sandbox API key alias' },
      { key: 'qliro_dev_api_url', value: 'https://playground.qliro.com', description: 'Qliro sandbox API URL' },

      // Production credentials
      { key: 'qliro_prod_enabled', value: 'false', description: 'Enable Qliro production environment' },
      { key: 'qliro_prod_api_key', value: envProdApiKey, description: 'Qliro production API key' },
      { key: 'qliro_prod_api_secret', value: envProdApiSecret, description: 'Qliro production API secret' },
      { key: 'qliro_prod_shared_secret', value: envProdApiSecret, description: 'Qliro production shared secret (alias)' },
      { key: 'qliro_prod_api_url', value: 'https://api.qliro.com', description: 'Qliro production API URL' },

      // Optional/other
      { key: 'qliro_webhook_secret', value: webhookSecret, description: 'Qliro webhook secret for signature verification' },
      { key: 'qliro_test_passed', value: 'false', description: 'Whether Qliro connectivity test has passed' },
      { key: 'qliro_last_test_date', value: '', description: 'Last Qliro test date' },
      { key: 'qliro_merchant_id', value: '', description: 'Qliro merchant ID (if required by admin UI)' }
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

    // Ensure required general settings
    console.log('\n🏷️ Ensuring required general settings...\n');
    const generalSettings = [
      { key: 'public_app_url', value: process.env.NEXT_PUBLIC_APP_URL || '', description: 'Public HTTPS URL of your app (required by Qliro callbacks)' }
    ];

    for (const setting of generalSettings) {
      const { key, value, description } = setting;
      await pool.query(`
        INSERT INTO site_settings (key, value, category, description, is_env, created_at, updated_at)
        VALUES ($1, $2, 'general', $3, $4, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE SET
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [key, value, description, false]);
      console.log(`✅ ${key}: configured`);
    }

    console.log('\n🎯 Testing database connection to Qliro settings...\n');

    // Test reading the settings like the application would
    const testResult = await pool.query(`
      SELECT key, value 
      FROM site_settings 
      WHERE key IN (
        'qliro_enabled', 'qliro_use_prod_env', 'qliro_prod_enabled', 'qliro_environment',
        'qliro_api_key', 'qliro_api_secret', 'qliro_secret', 'qliro_shared_secret',
        'qliro_prod_api_key', 'qliro_prod_api_secret', 'qliro_prod_shared_secret',
        'public_app_url', 'qliro_dev_api_url', 'qliro_prod_api_url', 'qliro_webhook_secret'
      )
    `);

    const settingsMap = testResult.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    // Resolve environment and credentials like the service does
    const prodEnabled = settingsMap.qliro_prod_enabled === 'true' || settingsMap.qliro_use_prod_env === 'true' || settingsMap.qliro_environment === 'production';
    const environment = prodEnabled ? 'production' : 'sandbox';
    const apiKey = environment === 'production'
      ? (settingsMap.qliro_prod_api_key || settingsMap.qliro_api_key || '')
      : (settingsMap.qliro_api_key || settingsMap.qliro_dev_api_key || '');
    const apiSecret = settingsMap.qliro_api_secret || settingsMap.qliro_secret || (environment === 'production' ? (settingsMap.qliro_prod_api_secret || settingsMap.qliro_prod_shared_secret || '') : '') || settingsMap.qliro_shared_secret || '';
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || settingsMap.public_app_url || '';
    const publicUrlValid = !!publicUrl && /^https:\/\//i.test(publicUrl);

    console.log('🧪 Test Results:');
    console.log(`- Qliro Enabled: ${settingsMap.qliro_enabled === 'true' ? '✅ Yes' : '❌ No'}`);
    console.log(`- Environment: ${environment}`);
    console.log(`- API Key Set (optional): ${apiKey ? '✅ Yes' : 'ℹ️ Not set (secret-only auth)'}`);
    console.log(`- API Secret Set: ${apiSecret ? '✅ Yes' : '❌ No'}`);
    console.log(`- Public URL (HTTPS): ${publicUrlValid ? '✅ Valid' : '❌ Missing/Invalid'}`);
    console.log(`- Webhook Secret Set: ${settingsMap.qliro_webhook_secret ? '✅ Yes' : '⚠️ No'}`);
    console.log(`- API URL (${environment}): ${environment === 'production' ? (settingsMap.qliro_prod_api_url || '(default)') : (settingsMap.qliro_dev_api_url || '(default)')}`);

    // Secret-only auth: require apiSecret and HTTPS public URL; apiKey is optional
    const isConfigured = settingsMap.qliro_enabled === 'true' && !!apiSecret && publicUrlValid;

    console.log(`\n${isConfigured ? '✅' : '❌'} Qliro Configuration: ${isConfigured ? 'READY' : 'INCOMPLETE'}\n`);

    if (isConfigured) {
      console.log('🎉 Qliro configuration looks good!');
      console.log('   Auth mode: Secret-only Bearer token. API key is optional and not required.');
      console.log('   Note: There is no mock fallback. If the API is unreachable, Qliro will be marked unavailable.');
    } else {
      console.log('⚠️  Configuration incomplete. Please set missing values via Admin Settings or environment variables and rerun.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
