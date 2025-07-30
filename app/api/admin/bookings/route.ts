import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { verifyToken as verifyJWT } from '@/lib/auth/jwt';

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allBookings = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        userName: users.name,
        userEmail: users.email,
        lessonTypeId: bookings.lessonTypeId,
        lessonTypeName: lessonTypes.name,
        scheduledDate: bookings.scheduledDate,
        scheduledTime: bookings.scheduledTime,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        paymentMethod: bookings.paymentMethod,
        totalPrice: bookings.totalPrice,
        isCompleted: bookings.isCompleted,
        completedAt: bookings.completedAt,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(isNull(bookings.deletedAt))
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json(allBookings);
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
    if (decoded.role !== 'admin') {
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
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    await db.update(bookings).set({
      deletedAt: new Date(),
    }).where(eq(bookings.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
