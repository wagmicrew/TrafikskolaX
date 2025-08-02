// Test script for guest booking functionality

async function testGuestBooking() {
  const baseUrl = 'http://localhost:3000';
  
  // Test case 1: Guest booking with new email
  console.log('=== Test 1: Guest booking with new email ===');
  try {
    const response = await fetch(`${baseUrl}/api/booking/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionType: 'lesson',
        sessionId: '715dbfe9-b313-4bc0-9004-34d295e989a2', // Actual lesson type ID
        scheduledDate: '2024-12-20',
        startTime: '10:00',
        endTime: '10:40',
        durationMinutes: 40,
        transmissionType: 'manual',
        totalPrice: 500,
        paymentMethod: 'swish',
        // Guest information
        guestName: 'Test Guest',
        guestEmail: `testguest${Date.now()}@example.com`,
        guestPhone: '0701234567'
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }

  // Test case 2: Guest booking with existing email
  console.log('\n=== Test 2: Guest booking with existing email ===');
  try {
    const response = await fetch(`${baseUrl}/api/booking/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionType: 'lesson',
        sessionId: '715dbfe9-b313-4bc0-9004-34d295e989a2',
        scheduledDate: '2024-12-21',
        startTime: '14:00',
        endTime: '14:40',
        durationMinutes: 40,
        transmissionType: 'automatic',
        totalPrice: 500,
        paymentMethod: 'swish',
        // Guest information with existing email
        guestName: 'Existing User',
        guestEmail: 'student@example.com', // This should exist in the database
        guestPhone: '0709876543'
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the tests
testGuestBooking();
