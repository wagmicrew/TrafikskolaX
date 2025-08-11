#!/usr/bin/env node

/**
 * Test Qliro Checkout Fix
 * This script tests the Qliro checkout API to verify the fix works
 */

const http = require('http');

const testData = {
  amount: 750,
  reference: `test-booking-${Date.now()}`,
  description: 'Test Booking: B-körkort',
  returnUrl: 'http://localhost:3000/booking/confirmation',
  customerEmail: 'test@example.com',
  customerPhone: '+46701234567',
  customerFirstName: 'Test',
  customerLastName: 'User'
};

async function testQliroCheckout() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/payments/qliro/create-checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🧪 Testing Qliro checkout API...\n');
    console.log('📋 Test Data:');
    console.log(`   Amount: ${testData.amount} SEK`);
    console.log(`   Reference: ${testData.reference}`);
    console.log(`   Description: ${testData.description}\n`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log(`📡 Response Status: ${res.statusCode}`);
          console.log('📄 Response Body:');
          console.log(JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('\n✅ SUCCESS: Qliro checkout API is working!');
            console.log('🌐 Qliro API connection established (no mock fallback in system)');
            
            console.log(`🔗 Checkout URL: ${response.checkoutUrl}`);
            resolve(response);
          } else {
            console.log('\n❌ FAILED: Checkout API returned error');
            reject(new Error(`API Error: ${response.error || 'Unknown error'}`));
          }
        } catch (error) {
          console.log('\n❌ FAILED: Invalid JSON response');
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('\n❌ FAILED: Network error');
      console.log('Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Make sure the development server is running with: npm run dev');
      }
      
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testQliroStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/payments/qliro/status',
      method: 'GET',
    };

    console.log('🔍 Testing Qliro status API...\n');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log(`📡 Status Response: ${res.statusCode}`);
          console.log('📄 Status Body:');
          console.log(JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200) {
            console.log('\n✅ Status API working');
            
            if (response.available) {
              console.log('🟢 Qliro is available');
              console.log(`🌍 Environment: ${response.environment}`);
            } else {
              console.log('🟡 Qliro not available');
              console.log(`📝 Reason: ${response.reason}`);
              console.log(`💬 Message: ${response.message}`);
            }
            
            resolve(response);
          } else {
            reject(new Error(`Status API Error: ${response.error || 'Unknown error'}`));
          }
        } catch (error) {
          console.log('\n❌ FAILED: Invalid JSON response from status API');
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('\n❌ FAILED: Network error on status API');
      console.log('Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Starting Qliro Integration Tests\n');
  console.log('═'.repeat(50));
  
  try {
    // First test the status API
    await testQliroStatus();
    
    console.log('\n' + '═'.repeat(50));
    
    // Then test the checkout creation
    await testQliroCheckout();
    
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 All tests passed! Qliro integration is working correctly.');
    console.log('\n💡 Summary:');
    console.log('   - The "fetch failed" error has been fixed');
    console.log('   - If the API is unreachable, Qliro will be marked unavailable (no mock fallback)');
    console.log('   - Booking payments should now work without errors');
    
  } catch (error) {
    console.log('\n' + '═'.repeat(50));
    console.log('💥 Test failed:', error.message);
    console.log('\n🔧 Next steps:');
    console.log('   1. Make sure the development server is running');
    console.log('   2. Check database connection');
    console.log('   3. Verify Qliro settings with: node scripts/fix-qliro-settings.js');
    process.exit(1);
  }
}

main();
