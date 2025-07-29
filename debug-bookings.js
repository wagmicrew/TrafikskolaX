import 'dotenv/config';
import { db } from './lib/db/index.js';
import { bookings, users, lessonTypes } from './lib/db/schema.js';
import { eq, isNull } from 'drizzle-orm';

async function debugBookings() {
  try {
    console.log('=== DEBUGGING BOOKINGS ===');
    
    // Check all users
    console.log('\n1. All users:');
    const allUsers = await db.select().from(users);
    allUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) [ID: ${user.id}] [Role: ${user.role}]`);
    });
    
    // Check all bookings
    console.log('\n2. All bookings:');
    const allBookings = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        totalPrice: bookings.totalPrice,
        lessonTypeName: lessonTypes.name,
        deletedAt: bookings.deletedAt,
      })
      .from(bookings)
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id));
    
    console.log(`Total bookings in database: ${allBookings.length}`);
    allBookings.forEach(booking => {
      console.log(`- Booking ${booking.id}: User ${booking.userId}, ${booking.scheduledDate} ${booking.startTime}, Status: ${booking.status}, Deleted: ${booking.deletedAt ? 'YES' : 'NO'}`);
    });
    
    // Check active bookings only
    console.log('\n3. Active bookings only:');
    const activeBookings = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        status: bookings.status,
        lessonTypeName: lessonTypes.name,
      })
      .from(bookings)
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(isNull(bookings.deletedAt));
    
    console.log(`Active bookings: ${activeBookings.length}`);
    activeBookings.forEach(booking => {
      console.log(`- Active Booking ${booking.id}: User ${booking.userId}, ${booking.scheduledDate} ${booking.startTime}, ${booking.lessonTypeName}`);
    });
    
    // Find student user
    console.log('\n4. Looking for student user:');
    const studentUser = await db.select().from(users).where(eq(users.email, 'student@test.se'));
    if (studentUser.length > 0) {
      console.log(`Student found: ${studentUser[0].firstName} ${studentUser[0].lastName} [ID: ${studentUser[0].id}]`);
      
      // Check bookings for this specific student
      console.log('\n5. Bookings for student@test.se:');
      const studentBookings = await db
        .select({
          id: bookings.id,
          scheduledDate: bookings.scheduledDate,
          startTime: bookings.startTime,
          status: bookings.status,
          lessonTypeName: lessonTypes.name,
        })
        .from(bookings)
        .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
        .where(eq(bookings.userId, studentUser[0].id));
      
      console.log(`Bookings for student: ${studentBookings.length}`);
      studentBookings.forEach(booking => {
        console.log(`- ${booking.scheduledDate} ${booking.startTime}: ${booking.lessonTypeName} (${booking.status})`);
      });
    } else {
      console.log('Student user not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debugBookings();
