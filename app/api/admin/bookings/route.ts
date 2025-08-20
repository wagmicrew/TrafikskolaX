import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, desc, isNull, and, gte, lte } from 'drizzle-orm';
import { verifyToken as verifyJWT } from '@/lib/auth/jwt';

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Build where conditions
    const conditions = [isNull(bookings.deletedAt)];

    if (userId) {
      conditions.push(eq(bookings.userId, userId));
    }

    if (startDate && endDate) {
      const startDateStr = startDate.split('T')[0];
      const endDateStr = endDate.split('T')[0];
      if (startDateStr && endDateStr) {
        const dateCondition = and(
          gte(bookings.scheduledDate, startDateStr),
          lte(bookings.scheduledDate, endDateStr)
        );
        if (dateCondition) {
          conditions.push(dateCondition);
        }
      }
    }

    const allBookings = await db
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
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(conditions.length === 1 ? conditions[0] : conditions.length > 1 ? and(...conditions.filter(Boolean)) : undefined)
      .orderBy(desc(bookings.createdAt));

    // Format the results for the frontend
    const formattedBookings = allBookings.map(booking => ({
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
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update booking status
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, paymentStatus, isCompleted } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      }
    }

    await db.update(bookings).set(updateData).where(eq(bookings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE (soft delete) booking
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    await db.update(bookings).set({
      deletedAt: new Date(),
    }).where(eq(bookings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
