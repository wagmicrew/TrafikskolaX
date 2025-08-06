/**
 * Test script for the daily booking summary email
 * This script can be run manually to test the teacher daily bookings functionality
 */

import { EmailCronService } from '../lib/email/email-cron-service';
import { db } from '@/lib/db';
import { bookings, users, userCredits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testDailySummary() {
  console.log('=== Testing Daily Booking Summary ===');
  
  try {
    // Test with a specific teacher email
    const testTeacherEmail = process.env.TEST_TEACHER_EMAIL;
    
    if (!testTeacherEmail) {
      console.error('Error: TEST_TEACHER_EMAIL environment variable not set');
      console.log('Please set TEST_TEACHER_EMAIL to a valid teacher email address');
      process.exit(1);
    }
    
    console.log(`Testing with teacher email: ${testTeacherEmail}`);
    
    // Verify the teacher exists
    const teacher = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, testTeacherEmail)
    });
    
    if (!teacher) {
      console.error(`Error: No teacher found with email ${testTeacherEmail}`);
      process.exit(1);
    }
    
    console.log(`Found teacher: ${teacher.firstName} ${teacher.lastName}`);
    
    // Create a test booking for today
    const today = new Date();
    const bookingData = {
      userId: teacher.id, // Using teacher as student for testing
      teacherId: teacher.id,
      lessonTypeId: 1, // Assuming ID 1 exists
      scheduledDate: today.toISOString().split('T')[0], // Today's date
      startTime: '10:00',
      endTime: '11:00',
      status: 'confirmed',
      paymentStatus: 'paid',
      totalPrice: '500',
      transmissionType: 'manual' as const,
      isCompleted: false,
      feedbackReady: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating test booking...');
    const [newBooking] = await db.insert(bookings).values(bookingData).returning();
    console.log(`Created test booking with ID: ${newBooking.id}`);
    
    try {
      // Run the daily summary
      console.log('\n=== Running Teacher Daily Bookings ===');
      await EmailCronService.sendTeacherDailyBookings();
      console.log('Daily bookings email should have been sent');
      
      console.log('\n=== Test Completed Successfully ===');
      console.log('Check the email inbox for the test email');
    } finally {
      // Clean up - remove the test booking
      console.log('\nCleaning up test data...');
      await db.delete(bookings).where(eq(bookings.id, newBooking.id));
      console.log('Test booking removed');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

// Run the test
testDailySummary().catch(console.error);
