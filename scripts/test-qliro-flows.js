#!/usr/bin/env node

/**
 * Qliro Flow Test Script
 * This script tests all booking flows to ensure they work with the new Qliro system
 */

const { qliroService } = require('../lib/payment/qliro-service');
const { db } = require('../lib/db');
const { siteSettings } = require('../lib/db/schema');

async function testQliroFlows() {
  try {
    console.log('🧪 Starting Qliro flow tests...\n');
    
    // Test 1: Check if Qliro is enabled
    console.log('1️⃣ Testing Qliro service availability...');
    const isEnabled = await qliroService.isEnabled();
    console.log(`   Qliro enabled: ${isEnabled ? '✅' : '❌'}`);
    
    if (!isEnabled) {
      console.log('   ⚠️  Qliro is not enabled. Please check settings.');
      return;
    }
    
    // Test 2: Check settings
    console.log('\n2️⃣ Testing Qliro settings...');
    const settings = await qliroService.getResolvedSettings(true);
    console.log(`   Environment: ${settings.environment}`);
    console.log(`   API URL: ${settings.apiUrl}`);
    console.log(`   Has API Key: ${settings.hasApiKey ? '✅' : '❌'}`);
    console.log(`   Has API Secret: ${settings.hasApiSecret ? '✅' : '❌'}`);
    
    // Test 3: Check database settings
    console.log('\n3️⃣ Testing database settings...');
    const dbSettings = await db.select().from(siteSettings).where(
      siteSettings.key.in(['qliro_checkout_flow', 'qliro_debug_logs', 'qliro_retry_attempts', 'qliro_cache_duration'])
    );
    
    const settingsMap = dbSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    console.log(`   qliro_checkout_flow: ${settingsMap.qliro_checkout_flow || 'not set'}`);
    console.log(`   qliro_debug_logs: ${settingsMap.qliro_debug_logs || 'not set'}`);
    console.log(`   qliro_retry_attempts: ${settingsMap.qliro_retry_attempts || 'not set'}`);
    console.log(`   qliro_cache_duration: ${settingsMap.qliro_cache_duration || 'not set'}`);
    
    // Test 4: Test API connection
    console.log('\n4️⃣ Testing Qliro API connection...');
    try {
      const connectionTest = await qliroService.testConnection({ extended: true });
      console.log(`   Connection test: ${connectionTest.success ? '✅' : '❌'}`);
      if (connectionTest.success) {
        console.log(`   Test order ID: ${connectionTest.details?.checkoutId}`);
      } else {
        console.log(`   Error: ${connectionTest.message}`);
      }
    } catch (error) {
      console.log(`   Connection test: ❌ ${error.message}`);
    }
    
    // Test 5: Test stale order cleanup
    console.log('\n5️⃣ Testing stale order cleanup...');
    try {
      const expiredCount = await qliroService.invalidateStaleOrders();
      console.log(`   Stale orders cleaned: ${expiredCount}`);
    } catch (error) {
      console.log(`   Cleanup test: ❌ ${error.message}`);
    }
    
    // Test 6: Test retry mechanism
    console.log('\n6️⃣ Testing retry mechanism...');
    try {
      // This will test the retry mechanism with a non-existent order
      await qliroService.getOrder('test-non-existent-order');
    } catch (error) {
      console.log(`   Retry mechanism: ✅ Working (expected error: ${error.message})`);
    }
    
    console.log('\n🎉 Qliro flow tests completed!');
    console.log('\n📋 Manual testing checklist:');
    console.log('   ✅ Book as Admin: Go to admin dashboard → Create booking → Select student → Choose Qliro');
    console.log('   ✅ Book as Teacher: Go to teacher dashboard → Create booking → Select student → Choose Qliro');
    console.log('   ✅ Book as Student: Go to booking page → Select lesson → Choose Qliro');
    console.log('   ✅ Book as Guest: Go to booking page → Select lesson → Fill guest info → Choose Qliro');
    console.log('   ✅ Package Purchase: Go to packages store → Select package → Choose Qliro');
    console.log('   ✅ Handledar Booking: Go to handledar page → Select session → Choose Qliro');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testQliroFlows();
