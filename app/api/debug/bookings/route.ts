import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      data: {} as any
    };

    // Check all users
    const allUsers = await db.select().from(users);
    debugInfo.data.users = allUsers.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }));

    // Check all bookings
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

    debugInfo.data.allBookings = allBookings;
    debugInfo.data.totalBookings = allBookings.length;

    // Check active bookings only
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

    debugInfo.data.activeBookings = activeBookings;
    debugInfo.data.activeBookingsCount = activeBookings.length;

    // Find student user
    const studentUser = await db.select().from(users).where(eq(users.email, 'student@test.se'));
    debugInfo.data.studentUser = studentUser[0] || null;

    if (studentUser.length > 0) {
      // Check bookings for this specific student
      const studentBookings = await db
        .select({
          id: bookings.id,
          scheduledDate: bookings.scheduledDate,
          startTime: bookings.startTime,
          status: bookings.status,
          paymentStatus: bookings.paymentStatus,
          totalPrice: bookings.totalPrice,
          lessonTypeName: lessonTypes.name,
          deletedAt: bookings.deletedAt,
        })
        .from(bookings)
        .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
        .where(eq(bookings.userId, studentUser[0].id));

      debugInfo.data.studentBookings = studentBookings;
      debugInfo.data.studentBookingsCount = studentBookings.length;
    }

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
