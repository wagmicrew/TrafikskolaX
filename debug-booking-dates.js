const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { bookings, lessonTypes } = require('./lib/db/schema');
const { eq, and, inArray, or } = require('drizzle-orm');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function debugBookingDates() {
  console.log('=== DEBUGGING BOOKING DATES ===');
  
  // Get all bookings for 2025-08-18
  const testDate = '2025-08-18';
  console.log(`\nQuerying bookings for date: ${testDate}`);
  
  const allBookings = await db
    .select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      createdAt: bookings.createdAt,
      lessonTypeName: lessonTypes.name,
      paymentStatus: bookings.paymentStatus,
    })
    .from(bookings)
    .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
    .where(
      and(
        eq(bookings.scheduledDate, testDate),
        or(
          eq(bookings.status, 'temp'),
          eq(bookings.status, 'on_hold'),
          eq(bookings.status, 'booked'),
          eq(bookings.status, 'confirmed')
        )
      )
    );

  console.log(`Found ${allBookings.length} bookings:`);
  allBookings.forEach((booking, index) => {
    console.log(`\nBooking ${index + 1}:`);
    console.log(`  ID: ${booking.id}`);
    console.log(`  Scheduled Date: ${booking.scheduledDate} (type: ${typeof booking.scheduledDate})`);
    console.log(`  Start Time: ${booking.startTime} (type: ${typeof booking.startTime})`);
    console.log(`  End Time: ${booking.endTime} (type: ${typeof booking.endTime})`);
    console.log(`  Status: ${booking.status}`);
    console.log(`  Payment Status: ${booking.paymentStatus}`);
    console.log(`  Lesson Type: ${booking.lessonTypeName}`);
    console.log(`  Created At: ${booking.createdAt}`);
    
    // Test the current grouping logic
    const key = booking.scheduledDate ? String(booking.scheduledDate).slice(0, 10) : '';
    console.log(`  Current grouping key: "${key}"`);
    
    // Test improved grouping logic
    const improvedKey = booking.scheduledDate instanceof Date 
      ? booking.scheduledDate.toISOString().slice(0, 10)
      : String(booking.scheduledDate).slice(0, 10);
    console.log(`  Improved grouping key: "${improvedKey}"`);
  });

  // Also test the inArray query that's used in the API
  console.log(`\n=== TESTING inArray QUERY ===`);
  const dateStrings = ['2025-08-18'];
  const inArrayBookings = await db
    .select({
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      lessonTypeName: lessonTypes.name,
      paymentStatus: bookings.paymentStatus,
    })
    .from(bookings)
    .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
    .where(
      and(
        inArray(bookings.scheduledDate, dateStrings),
        or(
          eq(bookings.status, 'temp'),
          eq(bookings.status, 'on_hold'),
          eq(bookings.status, 'booked'),
          eq(bookings.status, 'confirmed')
        )
      )
    );

  console.log(`inArray query found ${inArrayBookings.length} bookings:`);
  inArrayBookings.forEach((booking, index) => {
    console.log(`  ${index + 1}. ${booking.scheduledDate} ${booking.startTime} - ${booking.status} (${booking.lessonTypeName})`);
  });
}

debugBookingDates().catch(console.error);
