import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, handledarSessions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const sessionType = searchParams.get('sessionType');
    const reason = searchParams.get('reason') || 'User cancelled';

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    if (sessionType === 'handledar') {
      // Handle handledar booking cancellation
      const [booking] = await db
        .select()
        .from(handledarBookings)
        .where(eq(handledarBookings.id, bookingId))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // For handledar bookings, we can cancel any non-cancelled booking
      if (booking.status === 'cancelled') {
        return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
      }

      // Decrease participant count in session
      await db
        .update(handledarSessions)
        .set({
          currentParticipants: sql`GREATEST(${handledarSessions.currentParticipants} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(handledarSessions.id, booking.sessionId));

      // Delete the booking (handledar bookings are deleted, not just marked cancelled)
      await db
        .delete(handledarBookings)
        .where(eq(handledarBookings.id, bookingId));

      return NextResponse.json({
        message: 'Handledar booking cancelled successfully',
        bookingId: bookingId
      });

    } else {
      // Handle regular lesson booking cancellation
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Only allow cancellation of active bookings
      if (booking.status === 'cancelled') {
        return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
      }

      // Mark as cancelled instead of deleting
      await db
        .update(bookings)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));

      return NextResponse.json({
        message: 'Booking cancelled successfully',
        bookingId: booking.id
      });
    }

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'cleanup_expired') {
      // Clean up temporary bookings older than 10 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      // Clean up expired temporary regular bookings
      const expiredBookings = await db
        .update(bookings)
        .set({ 
          deletedAt: new Date(),
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(bookings.status, 'temp'),
            sql`${bookings.createdAt} < ${fifteenMinutesAgo}`
          )
        )
        .returning({ id: bookings.id });

      // Clean up expired pending handledar bookings
      const expiredHandledarBookings = await db
        .select()
        .from(handledarBookings)
        .where(
          and(
            eq(handledarBookings.status, 'pending'),
            sql`${handledarBookings.createdAt} < ${fifteenMinutesAgo}`
          )
        );

      // For each expired handledar booking, decrease participant count and delete
      for (const booking of expiredHandledarBookings) {
        await db
          .update(handledarSessions)
          .set({ 
            currentParticipants: sql`GREATEST(${handledarSessions.currentParticipants} - 1, 0)`,
            updatedAt: new Date()
          })
          .where(eq(handledarSessions.id, booking.sessionId));

        await db
          .delete(handledarBookings)
          .where(eq(handledarBookings.id, booking.id));
      }

      return NextResponse.json({ 
        message: 'Expired bookings cleaned up successfully',
        regularBookings: expiredBookings.length,
        handledarBookings: expiredHandledarBookings.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in cleanup operation:', error);
    return NextResponse.json({ error: 'Failed to perform cleanup operation' }, { status: 500 });
  }
}
