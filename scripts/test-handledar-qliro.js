#!/usr/bin/env node

/**
 * Test Handledar Qliro Payment Script
 * This script tests the handledar booking Qliro payment flow
 */

const fetch = require('node-fetch');

async function testHandledarQliro() {
  try {
    console.log('🧪 Testing Handledar Qliro payment...\n');
    
    // Test 1: Test the create-order API with handledar booking ID
    console.log('1️⃣ Testing create-order API with handledar booking...');
    
    const testHandledarBookingId = 'test-handledar-booking-id';
    const requestBody = {
      handledarBookingId: testHandledarBookingId
    };
    
    console.log('   Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3000/api/payments/qliro/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`   Response body: ${responseText}`);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('   ✅ Success! Response data:', JSON.stringify(data, null, 2));
    } else {
      console.log('   ❌ Error response');
      try {
        const errorData = JSON.parse(responseText);
        console.log('   Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('   Raw error response:', responseText);
      }
    }
    
    // Test 2: Test with different parameter names
    console.log('\n2️⃣ Testing with different parameter variations...');
    
    const variations = [
      { handledarBookingId: testHandledarBookingId },
      { handledar_booking_id: testHandledarBookingId },
      { handledarBooking: testHandledarBookingId },
      { bookingId: testHandledarBookingId }
    ];
    
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      console.log(`   Testing variation ${i + 1}:`, JSON.stringify(variation));
      
      try {
        const varResponse = await fetch('http://localhost:3000/api/payments/qliro/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Test-Script/1.0'
          },
          body: JSON.stringify(variation)
        });
        
        const varText = await varResponse.text();
        console.log(`   Status: ${varResponse.status}`);
        
        if (varResponse.ok) {
          console.log('   ✅ Success');
        } else {
          try {
            const varError = JSON.parse(varText);
            console.log('   ❌ Error:', varError.error);
          } catch (e) {
            console.log('   ❌ Error:', varText);
          }
        }
      } catch (error) {
        console.log('   ❌ Request failed:', error.message);
      }
    }
    
    console.log('\n🎉 Handledar Qliro test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check the server logs for detailed debugging information');
    console.log('   2. Verify the handledar booking ID is being sent correctly');
    console.log('   3. Check if the booking exists in the database');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testHandledarQliro();
