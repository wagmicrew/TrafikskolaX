import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/server-auth';
import { db } from '@/lib/db/client';
import { bookings, users, credits } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const bookingId = params.bookingId;

    // Verify that the booking exists and belongs to this teacher
    const booking = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        teacherId: bookings.teacherId,
        status: bookings.status,
        totalPrice: bookings.totalPrice,
        durationMinutes: bookings.durationMinutes,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking[0].teacherId !== user.id) {
      return NextResponse.json({ error: 'Access denied - not your booking' }, { status: 403 });
    }

    if (booking[0].status === 'cancelled' || booking[0].status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot cancel a booking that is already cancelled or completed' 
      }, { status: 400 });
    }

    // Start a transaction to update booking and add credit
    await db.transaction(async (tx) => {
      // Update the booking status to cancelled
      await tx
        .update(bookings)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      // Add a credit for the student
      await tx.insert(credits).values({
        userId: booking[0].userId,
        bookingId: bookingId,
        amount: booking[0].totalPrice || 0,
        minutesValue: booking[0].durationMinutes || 0,
        reason: 'Lektion avbokad av lärare',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled and credit issued to student' 
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
