/**
 * Test script to verify that booked slots are properly blocked
 */

async function testBookingBlocking() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('=== Testing Booking Blocking ===\n');
  
  const testDate = '2025-12-16'; // Use a future date
  const testTime = '09:05:00';
  const testEndTime = '09:45:00';
  
  // Test 1: Check initial slot availability
  console.log('1. Checking initial slot availability...');
  try {
    const response = await fetch(`${baseUrl}/api/booking/slots?startDate=${testDate}&endDate=${testDate}&duration=45`);
    
    if (response.ok) {
      const data = await response.json();
      const slots = data.slots[testDate] || [];
      const targetSlot = slots.find(slot => slot.time === testTime);
      
      if (targetSlot) {
        console.log(`✅ Initial slot status: ${targetSlot.available ? 'Available' : 'Unavailable'}`);
      } else {
        console.log('❌ Target slot not found');
        return;
      }
    } else {
      console.log('❌ Failed to fetch initial slots:', response.status);
      return;
    }
  } catch (error) {
    console.error('❌ Error checking initial slots:', error);
    return;
  }

  // Test 2: Create a test booking
  console.log('\n2. Creating a test booking...');
  try {
    const bookingResponse = await fetch(`${baseUrl}/api/booking/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionType: 'lesson',
        sessionId: '715dbfe9-b313-4bc0-9004-34d295e989a2', // Use a real lesson type ID
        scheduledDate: testDate,
        startTime: testTime,
        endTime: testEndTime,
        durationMinutes: 40,
        transmissionType: 'manual',
        totalPrice: 500,
        paymentMethod: 'temp',
        status: 'temp',
        // Guest information for temp booking
        guestName: 'Test User',
        guestEmail: `test${Date.now()}@example.com`,
        guestPhone: '0701234567'
      })
    });
    
    if (bookingResponse.ok) {
      const bookingData = await bookingResponse.json();
      console.log('✅ Test booking created:', bookingData.booking?.id);
    } else {
      const errorData = await bookingResponse.json();
      console.log('❌ Failed to create test booking:', errorData);
      return;
    }
  } catch (error) {
    console.error('❌ Error creating test booking:', error);
    return;
  }

  // Test 3: Check slot availability after booking
  console.log('\n3. Checking slot availability after booking...');
  try {
    const response = await fetch(`${baseUrl}/api/booking/slots?startDate=${testDate}&endDate=${testDate}&duration=45`);
    
    if (response.ok) {
      const data = await response.json();
      const slots = data.slots[testDate] || [];
      const targetSlot = slots.find(slot => slot.time === testTime);
      
      if (targetSlot) {
        console.log(`✅ Slot status after booking: ${targetSlot.available ? 'Available' : 'Unavailable'}`);
        
        if (!targetSlot.available) {
          console.log('🎉 SUCCESS: Slot is properly blocked after booking!');
        } else {
          console.log('❌ FAILURE: Slot is still available after booking!');
        }
      } else {
        console.log('❌ Target slot not found after booking');
      }
    } else {
      console.log('❌ Failed to fetch slots after booking:', response.status);
    }
  } catch (error) {
    console.error('❌ Error checking slots after booking:', error);
  }

  // Test 4: Check available slots endpoint
  console.log('\n4. Checking available slots endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/booking/available-slots?startDate=${testDate}&endDate=${testDate}&lessonTypeId=test&duration=45`);
    
    if (response.ok) {
      const data = await response.json();
      const slots = data.slots[testDate] || [];
      const targetSlot = slots.find(slot => slot.timeStart === testTime);
      
      if (targetSlot) {
        console.log('❌ FAILURE: Slot still appears in available slots!');
      } else {
        console.log('🎉 SUCCESS: Slot is properly excluded from available slots!');
      }
    } else {
      console.log('❌ Failed to fetch available slots:', response.status);
    }
  } catch (error) {
    console.error('❌ Error checking available slots:', error);
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testBookingBlocking().catch(console.error); 