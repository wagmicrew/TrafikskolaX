// Test script to verify complete Qliro flow with new authorization
const { QliroService } = require('../lib/payment/qliro-service');

async function testQliroFlow() {
  console.log('=== Testing Complete Qliro Flow ===');
  
  try {
    const qliroService = QliroService.getInstance();
    
    // Test 1: Check if enabled
    console.log('\n1. Checking if Qliro is enabled...');
    const isEnabled = await qliroService.isEnabled();
    console.log(`Qliro enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      return {
        success: false,
        message: 'Qliro is not enabled in settings'
      };
    }
    
    // Test 2: Get resolved settings (masked)
    console.log('\n2. Getting resolved settings...');
    const settings = await qliroService.getResolvedSettings();
    console.log('Settings:', {
      enabled: settings.enabled,
      environment: settings.environment,
      apiUrl: settings.apiUrl,
      publicUrl: settings.publicUrl,
      hasApiKey: settings.hasApiKey,
      hasApiSecret: settings.hasApiSecret,
      apiKeyMasked: settings.apiKeyMasked
    });
    
    // Test 3: Create test order
    console.log('\n3. Creating test order...');
    const testReference = `TEST-FLOW-${Date.now()}`;
    const testOrder = await qliroService.createCheckout({
      amount: 10000, // 100 SEK in öre
      reference: testReference,
      description: 'Test order for flow verification',
      returnUrl: `${settings.publicUrl}/test-return`,
      customerEmail: 'test@example.com',
      customerFirstName: 'Test',
      customerLastName: 'User',
      customerPhone: '+46701234567'
    });
    
    console.log('✅ Order created successfully');
    console.log(`Order ID: ${testOrder.checkoutId}`);
    console.log(`Payment URL: ${testOrder.checkoutUrl}`);
    console.log(`Merchant Reference: ${testOrder.merchantReference}`);
    
    // Test 4: Fetch order status
    console.log('\n4. Fetching order status...');
    const orderStatus = await qliroService.getOrder(testOrder.checkoutId);
    console.log('✅ Order status fetched successfully');
    console.log(`Status: ${orderStatus.CustomerCheckoutStatus || 'Unknown'}`);
    console.log(`Total Price: ${orderStatus.TotalPrice || 'Unknown'}`);
    console.log(`Currency: ${orderStatus.Currency || 'Unknown'}`);
    
    // Test 5: Verify payment link is accessible
    console.log('\n5. Verifying payment link...');
    if (testOrder.checkoutUrl) {
      console.log('✅ Payment link is available');
      console.log(`Payment Link: ${testOrder.checkoutUrl}`);
    } else {
      console.log('⚠️ No payment link in response');
    }
    
    return {
      success: true,
      message: 'Complete Qliro flow test passed',
      details: {
        orderId: testOrder.checkoutId,
        paymentUrl: testOrder.checkoutUrl,
        merchantReference: testOrder.merchantReference,
        status: orderStatus.CustomerCheckoutStatus
      }
    };
    
  } catch (error) {
    console.error('❌ Flow test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    };
  }
}

// Run if called directly
if (require.main === module) {
  testQliroFlow()
    .then(result => {
      console.log('\n=== Test Result ===');
      console.log(`Success: ${result.success}`);
      console.log(`Message: ${result.message}`);
      if (result.details) {
        console.log('Details:', result.details);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test script error:', error);
      process.exit(1);
    });
}

module.exports = testQliroFlow;
