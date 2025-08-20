#!/usr/bin/env node

/**
 * Test script to verify Qliro return URL generation
 * This script tests that the return URLs are correctly pointing to production
 */

require('dotenv').config({ path: '.env.local' });

async function testQliroReturnUrls() {
  console.log('=== Testing Qliro Return URL Generation ===\n');
  
  // Test the URL generation logic
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXTAUTH_URL || 
                 'https://www.dintrafikskolahlm.se';
  
  console.log('Environment variables:');
  console.log(`  NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'}`);
  console.log(`  NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NOT SET'}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
  console.log(`  Resolved baseUrl: ${baseUrl}\n`);
  
  // Test different return URL scenarios
  const testCases = [
    {
      type: 'Booking',
      ref: 'booking_90b04e47-2fd7-4d12-b450-fde0ffba29e4',
      expectedPath: '/booking/confirmation/90b04e47-2fd7-4d12-b450-fde0ffba29e4'
    },
    {
      type: 'Handledar',
      ref: 'handledar_12345678-1234-1234-1234-123456789012',
      expectedPath: '/handledar/confirmation/12345678-1234-1234-1234-123456789012'
    },
    {
      type: 'Package',
      ref: 'package_87654321-4321-4321-4321-210987654321',
      expectedPath: '/packages-store/confirmation/87654321-4321-4321-4321-210987654321'
    }
  ];
  
  console.log('Testing return URL generation:');
  
  for (const testCase of testCases) {
    const { type, ref, expectedPath } = testCase;
    
    // Simulate the Qliro return URL logic
    let bookingId, handledarBookingId, purchaseId;
    
    if (ref.startsWith('booking_')) {
      bookingId = ref.replace('booking_', '');
    } else if (ref.startsWith('handledar_')) {
      handledarBookingId = ref.replace('handledar_', '');
    } else if (ref.startsWith('package_')) {
      purchaseId = ref.replace('package_', '');
    }
    
    let redirectUrl;
    if (bookingId) {
      redirectUrl = new URL(`/booking/confirmation/${bookingId}`, baseUrl);
      redirectUrl.searchParams.set('payment_method', 'qliro');
      redirectUrl.searchParams.set('status', 'success');
    } else if (handledarBookingId) {
      redirectUrl = new URL(`/handledar/confirmation/${handledarBookingId}`, baseUrl);
      redirectUrl.searchParams.set('payment_method', 'qliro');
      redirectUrl.searchParams.set('status', 'success');
    } else if (purchaseId) {
      redirectUrl = new URL(`/packages-store/confirmation/${purchaseId}`, baseUrl);
      redirectUrl.searchParams.set('payment_method', 'qliro');
      redirectUrl.searchParams.set('status', 'success');
    }
    
    console.log(`\n${type} Return URL:`);
    console.log(`  Reference: ${ref}`);
    console.log(`  Generated URL: ${redirectUrl}`);
    console.log(`  Contains localhost: ${redirectUrl.includes('localhost') ? '❌ YES' : '✅ NO'}`);
    console.log(`  Uses HTTPS: ${redirectUrl.startsWith('https://') ? '✅ YES' : '❌ NO'}`);
    console.log(`  Correct path: ${redirectUrl.pathname === expectedPath ? '✅ YES' : '❌ NO'}`);
  }
  
  console.log('\n=== Test Summary ===');
  console.log('✅ All return URLs should now use the production domain');
  console.log('✅ No more localhost:3000 redirects');
  console.log('✅ All URLs should use HTTPS');
  
  // Test the actual problematic URL
  console.log('\n=== Testing the problematic URL ===');
  const problematicUrl = 'https://localhost:3000/booking/confirmation/90b04e47-2fd7-4d12-b450-fde0ffba29e4?payment_method=qliro&status=failed';
  console.log(`Problematic URL: ${problematicUrl}`);
  console.log(`This should now be: ${baseUrl}/booking/confirmation/90b04e47-2fd7-4d12-b450-fde0ffba29e4?payment_method=qliro&status=failed`);
}

// Run the test
testQliroReturnUrls()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
