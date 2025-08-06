/**
 * Test script to check slot settings and configuration
 */

async function testSlotSettings() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('=== Testing Slot Settings ===\n');
  
  // Test 1: Check slot settings for Monday (day 1)
  console.log('1. Testing slot settings for Monday (day 1)...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/slots?dayOfWeek=1`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Slot settings response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to fetch slot settings:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing slot settings:', error);
  }

  // Test 2: Check what day of week January 20, 2025 is
  console.log('\n2. Checking day of week for January 20, 2025...');
  const testDate = new Date('2025-01-20');
  const dayOfWeek = testDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  console.log(`📅 January 20, 2025 is day ${dayOfWeek} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]})`);

  // Test 3: Check slot settings for the correct day
  console.log(`\n3. Testing slot settings for day ${dayOfWeek}...`);
  try {
    const response = await fetch(`${baseUrl}/api/admin/slots?dayOfWeek=${dayOfWeek}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Slot settings response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to fetch slot settings:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing slot settings:', error);
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testSlotSettings().catch(console.error); 