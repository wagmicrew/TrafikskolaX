import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, and, gte, lte, asc, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const teacherId = searchParams.get('teacherId');
    const upcoming = searchParams.get('upcoming');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        userName: users.firstName,
        userLastName: users.lastName,
        userPhone: users.phone,
        userEmail: users.email,
        lessonTypeId: bookings.lessonTypeId,
        lessonTypeName: lessonTypes.name,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        totalPrice: bookings.totalPrice,
        isCompleted: bookings.isCompleted,
        durationMinutes: bookings.durationMinutes,
        transmissionType: bookings.transmissionType,
        teacherId: bookings.teacherId,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id));

    // Build where conditions
    const conditions = [];

    // Filter by teacher ID (only show bookings assigned to this teacher)
    if (teacherId && teacherId === (user.userId || user.id)) {
      conditions.push(eq(bookings.teacherId, teacherId));
    } else {
      conditions.push(eq(bookings.teacherId, user.userId || user.id));
    }

    // Filter by specific date (for today's bookings)
    if (date) {
      conditions.push(eq(bookings.scheduledDate, date));
    }

    // Filter by date range (for export functions)
    if (startDate && endDate) {
      conditions.push(
        and(
          gte(bookings.scheduledDate, startDate.split('T')[0]),
          lte(bookings.scheduledDate, endDate.split('T')[0])
        )
      );
    }

    // Filter for upcoming bookings (after today)
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(gte(bookings.scheduledDate, today));
      query = query.orderBy(asc(bookings.scheduledDate), asc(bookings.startTime));
    } else {
      query = query.orderBy(asc(bookings.startTime));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    // Format the results for the frontend
    const formattedBookings = results.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      userName: `${booking.userName || ''} ${booking.userLastName || ''}`.trim() || 'Okänd användare',
      userPhone: booking.userPhone,
      userEmail: booking.userEmail,
      lessonTypeId: booking.lessonTypeId,
      lessonTypeName: booking.lessonTypeName || 'Okänd lektionstyp',
      scheduledDate: booking.scheduledDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      isCompleted: booking.isCompleted,
      durationMinutes: booking.durationMinutes,
      transmissionType: booking.transmissionType || 'manual',
      teacherId: booking.teacherId,
      createdAt: booking.createdAt,
    }));

    return NextResponse.json({ 
      bookings: formattedBookings,
      total: formattedBookings.length 
    });
  } catch (error) {
    console.error('Error fetching teacher bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
