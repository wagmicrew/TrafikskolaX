import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { fetchAllFutureBookings, fetchDailyBookings, fetchWeeklyBookings } from '@/utils/pdfExport';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the auth token for server-side requests
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const authToken = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    console.log('Starting export functions test...');

    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };

    // Test 1: Fetch all future bookings for teachers
    try {
      console.log('1. Testing fetchAllFutureBookings for teachers...');
      const futureBookingsTeacher = await fetchAllFutureBookings(undefined, 'teacher', authToken);
      results.tests.push({
        name: 'fetchAllFutureBookings (teacher)',
        success: true,
        count: futureBookingsTeacher.length,
        data: futureBookingsTeacher.slice(0, 2) // First 2 bookings for preview
      });
      console.log(`Found ${futureBookingsTeacher.length} future bookings for teachers`);
    } catch (error: any) {
      console.error('Error in fetchAllFutureBookings (teacher):', error);
      results.tests.push({
        name: 'fetchAllFutureBookings (teacher)',
        success: false,
        error: error.message
      });
    }

    // Test 2: Fetch all future bookings for admins
    try {
      console.log('2. Testing fetchAllFutureBookings for admins...');
      const futureBookingsAdmin = await fetchAllFutureBookings(undefined, 'admin', authToken);
      results.tests.push({
        name: 'fetchAllFutureBookings (admin)',
        success: true,
        count: futureBookingsAdmin.length,
        data: futureBookingsAdmin.slice(0, 2) // First 2 bookings for preview
      });
      console.log(`Found ${futureBookingsAdmin.length} future bookings for admins`);
    } catch (error: any) {
      console.error('Error in fetchAllFutureBookings (admin):', error);
      results.tests.push({
        name: 'fetchAllFutureBookings (admin)',
        success: false,
        error: error.message
      });
    }

    // Test 3: Fetch daily bookings for teachers
    try {
      console.log('3. Testing fetchDailyBookings for teachers...');
      const dailyBookingsTeacher = await fetchDailyBookings(undefined, 'teacher', authToken);
      results.tests.push({
        name: 'fetchDailyBookings (teacher)',
        success: true,
        count: dailyBookingsTeacher.length,
        data: dailyBookingsTeacher.slice(0, 2) // First 2 bookings for preview
      });
      console.log(`Found ${dailyBookingsTeacher.length} daily bookings for teachers`);
    } catch (error: any) {
      console.error('Error in fetchDailyBookings (teacher):', error);
      results.tests.push({
        name: 'fetchDailyBookings (teacher)',
        success: false,
        error: error.message
      });
    }

    // Test 4: Fetch daily bookings for admins
    try {
      console.log('4. Testing fetchDailyBookings for admins...');
      const dailyBookingsAdmin = await fetchDailyBookings(undefined, 'admin', authToken);
      results.tests.push({
        name: 'fetchDailyBookings (admin)',
        success: true,
        count: dailyBookingsAdmin.length,
        data: dailyBookingsAdmin.slice(0, 2) // First 2 bookings for preview
      });
      console.log(`Found ${dailyBookingsAdmin.length} daily bookings for admins`);
    } catch (error: any) {
      console.error('Error in fetchDailyBookings (admin):', error);
      results.tests.push({
        name: 'fetchDailyBookings (admin)',
        success: false,
        error: error.message
      });
    }

    // Test 5: Fetch weekly bookings for teachers
    try {
      console.log('5. Testing fetchWeeklyBookings for teachers...');
      const weeklyBookingsTeacher = await fetchWeeklyBookings(undefined, 'teacher', authToken);
      results.tests.push({
        name: 'fetchWeeklyBookings (teacher)',
        success: true,
        count: weeklyBookingsTeacher.length,
        data: weeklyBookingsTeacher.slice(0, 2) // First 2 bookings for preview
      });
      console.log(`Found ${weeklyBookingsTeacher.length} weekly bookings for teachers`);
    } catch (error: any) {
      console.error('Error in fetchWeeklyBookings (teacher):', error);
      results.tests.push({
        name: 'fetchWeeklyBookings (teacher)',
        success: false,
        error: error.message
      });
    }

    // Test 6: Fetch weekly bookings for admins
    try {
      console.log('6. Testing fetchWeeklyBookings for admins...');
      const weeklyBookingsAdmin = await fetchWeeklyBookings(undefined, 'admin', authToken);
      results.tests.push({
        name: 'fetchWeeklyBookings (admin)',
        success: true,
        count: weeklyBookingsAdmin.length,
        data: weeklyBookingsAdmin.slice(0, 2) // First 2 bookings for preview
      });
      console.log(`Found ${weeklyBookingsAdmin.length} weekly bookings for admins`);
    } catch (error: any) {
      console.error('Error in fetchWeeklyBookings (admin):', error);
      results.tests.push({
        name: 'fetchWeeklyBookings (admin)',
        success: false,
        error: error.message
      });
    }

    // Calculate summary
    const successfulTests = results.tests.filter(test => test.success).length;
    const totalTests = results.tests.length;
    
    console.log(`✅ Export functions test completed! ${successfulTests}/${totalTests} tests passed`);

    return NextResponse.json({
      success: true,
      message: `Export functions test completed! ${successfulTests}/${totalTests} tests passed`,
      results,
      summary: {
        total: totalTests,
        passed: successfulTests,
        failed: totalTests - successfulTests
      }
    });

  } catch (error: any) {
    console.error('Error in export functions test:', error);
    return NextResponse.json({ 
      error: 'Failed to test export functions',
      details: error.message 
    }, { status: 500 });
  }
} 