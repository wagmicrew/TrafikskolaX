const { QliroService } = require('./lib/payment/qliro-service.ts');

async function testQliroSettings() {
  console.log('=== Testing Qliro Settings and Connectivity ===\n');

  try {
    const qliroService = QliroService.getInstance();
    
    // Test 1: Check if Qliro is enabled
    console.log('1. Checking if Qliro is enabled...');
    const isEnabled = await qliroService.isEnabled();
    console.log(`   Qliro enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      console.log('   ⚠️  Qliro is disabled. Enable it in site settings to continue.');
      return;
    }

    // Test 2: Test basic connection
    console.log('\n2. Testing basic API connection...');
    const connectionTest = await qliroService.testConnection();
    
    if (connectionTest.success) {
      console.log('   ✅ Connection test passed');
      console.log(`   Message: ${connectionTest.message}`);
      if (connectionTest.details) {
        console.log(`   Checkout ID: ${connectionTest.details.checkoutId}`);
        console.log(`   Payment URL: ${connectionTest.details.checkoutUrl}`);
      }
    } else {
      console.log('   ❌ Connection test failed');
      console.log(`   Error: ${connectionTest.message}`);
    }

    // Test 3: Test extended connection with debug info
    console.log('\n3. Testing extended connection with debug info...');
    const extendedTest = await qliroService.testConnection({ extended: true });
    
    if (extendedTest.success) {
      console.log('   ✅ Extended test passed');
      if (extendedTest.debug) {
        console.log('   Debug info:', {
          apiKey: extendedTest.debug.apiKey ? `${extendedTest.debug.apiKey.substring(0, 8)}...` : 'Not set',
          apiUrl: extendedTest.debug.apiUrl
        });
      }
    } else {
      console.log('   ❌ Extended test failed');
      console.log(`   Error: ${extendedTest.message}`);
      if (extendedTest.debug) {
        console.log('   Debug info:', extendedTest.debug);
      }
    }

    // Test 4: Test order creation with customer data
    console.log('\n4. Testing order creation with customer data...');
    try {
      const testOrder = await qliroService.createCheckout({
        amount: 50000, // 500 SEK
        reference: `TEST-${Date.now()}`,
        description: 'Test order with customer data',
        returnUrl: 'https://example.com/return',
        customerEmail: 'test@example.com',
        customerFirstName: 'Test',
        customerLastName: 'User',
        customerPhone: '+46701234567'
      });
      
      console.log('   ✅ Order creation with customer data successful');
      console.log(`   Order ID: ${testOrder.checkoutId}`);
      console.log(`   Payment URL: ${testOrder.checkoutUrl}`);
      console.log(`   Merchant Reference: ${testOrder.merchantReference}`);
    } catch (error) {
      console.log('   ❌ Order creation failed');
      console.log(`   Error: ${error.message}`);
      if (error.status) {
        console.log(`   HTTP Status: ${error.status}`);
      }
      if (error.body) {
        console.log(`   Response Body: ${error.body}`);
      }
    }

  } catch (error) {
    console.error('Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testQliroSettings().catch(console.error);
