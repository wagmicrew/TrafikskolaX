import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { bookings, users, lessonTypes, packages } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Student bookings API - User from token:', user);
    console.log('Student bookings API - User ID:', user.id, 'or userId:', user.userId);

    // Fetch all bookings for the student
    const studentBookings = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        lessonTypeId: bookings.lessonTypeId,
        lessonTypeName: lessonTypes.name,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        totalPrice: bookings.totalPrice,
        notes: bookings.notes,
        transmissionType: bookings.transmissionType,
        isCompleted: bookings.isCompleted,
        teacherId: bookings.teacherId,
        teacherName: users.firstName,
        teacherLastName: users.lastName,
        durationMinutes: bookings.durationMinutes,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .leftJoin(users, eq(bookings.teacherId, users.id))
      .where(and(
        eq(bookings.userId, user.userId || user.id),
        isNull(bookings.deletedAt)
      ))
      .orderBy(desc(bookings.scheduledDate), desc(bookings.startTime));

    // Format the bookings for the frontend
    const formattedBookings = studentBookings.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      lessonTypeId: booking.lessonTypeId,
      lessonTypeName: booking.lessonTypeName || 'Okänd lektionstyp',
      scheduledDate: booking.scheduledDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      notes: booking.notes,
      transmissionType: booking.transmissionType || 'manual',
      isCompleted: booking.isCompleted,
      teacherId: booking.teacherId,
      teacherName: booking.teacherName && booking.teacherLastName 
        ? `${booking.teacherName} ${booking.teacherLastName}` 
        : 'Ingen lärare tilldelad',
      durationMinutes: booking.durationMinutes,
      createdAt: booking.createdAt,
    }));

    return NextResponse.json({ 
      bookings: formattedBookings,
      total: formattedBookings.length 
    });
  } catch (error) {
    console.error('Error fetching student bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
