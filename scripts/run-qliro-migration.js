#!/usr/bin/env node

/**
 * Qliro Migration Script
 * This script runs the Qliro checkout flow migration to set up the database settings
 */

const { db } = require('../lib/db');
const { siteSettings } = require('../lib/db/schema');

async function runQliroMigration() {
  try {
    console.log('🚀 Starting Qliro migration...');
    
    // Add qliro_checkout_flow setting
    console.log('📝 Adding qliro_checkout_flow setting...');
    await db.insert(siteSettings).values({
      key: 'qliro_checkout_flow',
      value: 'window',
      description: 'Qliro checkout flow type: window (new window) or popup (modal popup)',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        description: 'Qliro checkout flow type: window (new window) or popup (modal popup)',
        updatedAt: new Date()
      }
    });
    console.log('✅ qliro_checkout_flow setting added/updated');

    // Add qliro_debug_logs setting
    console.log('📝 Adding qliro_debug_logs setting...');
    await db.insert(siteSettings).values({
      key: 'qliro_debug_logs',
      value: 'false',
      description: 'Enable extended Qliro debug logging',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        description: 'Enable extended Qliro debug logging',
        updatedAt: new Date()
      }
    });
    console.log('✅ qliro_debug_logs setting added/updated');

    // Add qliro_retry_attempts setting
    console.log('📝 Adding qliro_retry_attempts setting...');
    await db.insert(siteSettings).values({
      key: 'qliro_retry_attempts',
      value: '3',
      description: 'Number of retry attempts for Qliro API calls',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        description: 'Number of retry attempts for Qliro API calls',
        updatedAt: new Date()
      }
    });
    console.log('✅ qliro_retry_attempts setting added/updated');

    // Add qliro_cache_duration setting
    console.log('📝 Adding qliro_cache_duration setting...');
    await db.insert(siteSettings).values({
      key: 'qliro_cache_duration',
      value: '300',
      description: 'Qliro settings cache duration in seconds',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        description: 'Qliro settings cache duration in seconds',
        updatedAt: new Date()
      }
    });
    console.log('✅ qliro_cache_duration setting added/updated');

    // Verify the settings were added
    console.log('🔍 Verifying settings...');
    const settings = await db.select().from(siteSettings).where(
      siteSettings.key.in(['qliro_checkout_flow', 'qliro_debug_logs', 'qliro_retry_attempts', 'qliro_cache_duration'])
    );
    
    console.log('📊 Migration results:');
    settings.forEach(setting => {
      console.log(`  - ${setting.key}: ${setting.value} (${setting.description})`);
    });

    console.log('🎉 Qliro migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Go to Admin Settings → Betalningsinställningar → Qliro');
    console.log('  2. Set "Checkout Flow Type" to "Modern popup" for the new experience');
    console.log('  3. Test the flow with different user types:');
    console.log('     - Book as Admin');
    console.log('     - Book as Teacher');
    console.log('     - Book as Student');
    console.log('     - Book as Guest');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runQliroMigration();
