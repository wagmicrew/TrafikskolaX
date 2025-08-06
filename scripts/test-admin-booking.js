import fetch from 'node-fetch';

async function testAdminBooking() {
  try {
    console.log('Testing admin booking creation...');
    
    const testData = {
      studentId: 'test-student-id', // This would be a real student ID
      lessonTypeId: 'test-lesson-type-id', // This would be a real lesson type ID
      scheduledDate: '2025-08-10',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      transmissionType: 'manual',
      totalPrice: 500,
      paymentMethod: 'admin_created',
      paymentStatus: 'paid',
      status: 'confirmed',
      notes: 'Test booking created by admin'
    };

    const response = await fetch('http://localhost:3000/api/admin/bookings/create-for-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=your-token-here' // This would be a real auth token
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Admin booking created successfully:', result);
    } else {
      const error = await response.json();
      console.log('❌ Admin booking failed:', error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAdminBooking(); 