/**
 * Test script to verify slot availability functionality
 */

async function testSlotAvailability() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('=== Testing Slot Availability ===\n');
  
  // Test 1: Check slots for a specific date (use a future date)
  console.log('1. Testing slot availability for a specific date...');
  try {
    const testDate = '2025-12-15'; // Use a future date (December 15, 2025)
    const response = await fetch(`${baseUrl}/api/booking/slots?startDate=${testDate}&endDate=${testDate}&duration=45`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Slot availability response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.slots) {
        const dateKey = testDate;
        const slots = data.slots[dateKey] || [];
        console.log(`📅 Found ${slots.length} slots for ${testDate}`);
        
        const availableSlots = slots.filter(slot => slot.available);
        const unavailableSlots = slots.filter(slot => !slot.available);
        
        console.log(`✅ Available slots: ${availableSlots.length}`);
        console.log(`❌ Unavailable slots: ${unavailableSlots.length}`);
        
        if (unavailableSlots.length > 0) {
          console.log('🔍 Unavailable slots:');
          unavailableSlots.forEach(slot => {
            console.log(`   - ${slot.time} (${slot.callForAvailability ? 'Call for availability' : 'Booked/Blocked'})`);
          });
        }
      }
    } else {
      console.log('❌ Failed to fetch slots:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing slot availability:', error);
  }

  // Test 2: Check available slots endpoint
  console.log('\n2. Testing available slots endpoint...');
  try {
    const testDate = '2025-12-15';
    const response = await fetch(`${baseUrl}/api/booking/available-slots?startDate=${testDate}&endDate=${testDate}&lessonTypeId=test&duration=45`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Available slots response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.slots) {
        const slots = data.slots[testDate] || [];
        console.log(`📅 Found ${slots.length} available slots for ${testDate}`);
      }
    } else {
      console.log('❌ Failed to fetch available slots:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing available slots:', error);
  }

  // Test 3: Check bookings endpoint to see what bookings exist
  console.log('\n3. Testing bookings endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/bookings?startDate=2025-12-01&endDate=2025-12-31`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bookings response:', JSON.stringify(data, null, 2));
      
      if (data.bookings) {
        console.log(`📅 Found ${data.bookings.length} bookings in December 2025`);
        
        // Group by date
        const bookingsByDate = {};
        data.bookings.forEach(booking => {
          const date = booking.scheduledDate;
          if (!bookingsByDate[date]) {
            bookingsByDate[date] = [];
          }
          bookingsByDate[date].push(booking);
        });
        
        console.log('📊 Bookings by date:');
        Object.entries(bookingsByDate).forEach(([date, bookings]) => {
          console.log(`   ${date}: ${bookings.length} booking(s)`);
          bookings.forEach(booking => {
            console.log(`     - ${booking.startTime}-${booking.endTime} (${booking.status})`);
          });
        });
      }
    } else {
      console.log('❌ Failed to fetch bookings:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing bookings:', error);
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testSlotAvailability().catch(console.error); 