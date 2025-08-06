import { fetchAllFutureBookings, fetchDailyBookings, fetchWeeklyBookings } from '../utils/pdfExport.ts';

async function testExportFunctions() {
  console.log('Testing export functions...\n');

  try {
    // Test fetching all future bookings for teachers
    console.log('1. Testing fetchAllFutureBookings for teachers...');
    const futureBookingsTeacher = await fetchAllFutureBookings(undefined, 'teacher');
    console.log(`Found ${futureBookingsTeacher.length} future bookings for teachers`);

    // Test fetching all future bookings for admins
    console.log('\n2. Testing fetchAllFutureBookings for admins...');
    const futureBookingsAdmin = await fetchAllFutureBookings(undefined, 'admin');
    console.log(`Found ${futureBookingsAdmin.length} future bookings for admins`);

    // Test fetching daily bookings for teachers
    console.log('\n3. Testing fetchDailyBookings for teachers...');
    const dailyBookingsTeacher = await fetchDailyBookings(undefined, 'teacher');
    console.log(`Found ${dailyBookingsTeacher.length} daily bookings for teachers`);

    // Test fetching daily bookings for admins
    console.log('\n4. Testing fetchDailyBookings for admins...');
    const dailyBookingsAdmin = await fetchDailyBookings(undefined, 'admin');
    console.log(`Found ${dailyBookingsAdmin.length} daily bookings for admins`);

    // Test fetching weekly bookings for teachers
    console.log('\n5. Testing fetchWeeklyBookings for teachers...');
    const weeklyBookingsTeacher = await fetchWeeklyBookings(undefined, 'teacher');
    console.log(`Found ${weeklyBookingsTeacher.length} weekly bookings for teachers`);

    // Test fetching weekly bookings for admins
    console.log('\n6. Testing fetchWeeklyBookings for admins...');
    const weeklyBookingsAdmin = await fetchWeeklyBookings(undefined, 'admin');
    console.log(`Found ${weeklyBookingsAdmin.length} weekly bookings for admins`);

    console.log('\n✅ All export functions tested successfully!');
    
    // Show sample data structure
    if (futureBookingsTeacher.length > 0) {
      console.log('\nSample booking data structure:');
      console.log(JSON.stringify(futureBookingsTeacher[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing export functions:', error);
  }
}

// Run the test
testExportFunctions()
  .then(() => {
    console.log('\nTest completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 