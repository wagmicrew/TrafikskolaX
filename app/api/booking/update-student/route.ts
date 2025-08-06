import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, studentId, sessionType } = body;

    if (!bookingId || !studentId) {
      return NextResponse.json({ error: 'Booking ID and Student ID are required' }, { status: 400 });
    }

    // Verify admin/teacher permissions
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    if (!payload || !['admin', 'teacher'].includes(payload.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get student information
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (sessionType === 'handledar') {
      // Update handledar booking
      const [updatedBooking] = await db
        .update(handledarBookings)
        .set({
          studentId: studentId,
          supervisorName: student.firstName + ' ' + student.lastName,
          supervisorEmail: student.email,
          supervisorPhone: student.phone || '',
          updatedAt: new Date()
        })
        .where(eq(handledarBookings.id, bookingId))
        .returning();

      if (!updatedBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        booking: updatedBooking,
        message: 'Handledar booking updated with student information'
      });
    } else {
      // Update regular booking
      const [updatedBooking] = await db
        .update(bookings)
        .set({
          userId: studentId,
          guestName: null,
          guestEmail: null,
          guestPhone: null,
          isGuestBooking: false,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      if (!updatedBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        booking: updatedBooking,
        message: 'Booking updated with student information'
      });
    }

  } catch (error) {
    console.error('Error updating booking with student:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
} 