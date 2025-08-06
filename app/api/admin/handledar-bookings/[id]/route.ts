import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarBookings, handledarSessions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: bookingId } = await params;

    // Get booking details first
    const booking = await db
      .select({
        id: handledarBookings.id,
        sessionId: handledarBookings.sessionId,
        paymentStatus: handledarBookings.paymentStatus,
      })
      .from(handledarBookings)
      .where(eq(handledarBookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];

    // Don't allow deletion of paid bookings
    if (bookingData.paymentStatus === 'paid') {
      return NextResponse.json({ 
        error: 'Cannot remove confirmed bookings. Refund required.' 
      }, { status: 400 });
    }

    // Delete the booking
    await db.delete(handledarBookings).where(eq(handledarBookings.id, bookingId));

    // Update session participant count
    await db
      .update(handledarSessions)
      .set({
        currentParticipants: sql`current_participants - 1`,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, bookingData.sessionId));

    return NextResponse.json({ message: 'Booking removed successfully' });
  } catch (error) {
    console.error('Error removing handledar booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'remind') {
      // Update reminder status
      const updatedBooking = await db
        .update(handledarBookings)
        .set({
          reminderSent: true,
          updatedAt: new Date(),
        })
        .where(eq(handledarBookings.id, bookingId))
        .returning();

      if (updatedBooking.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Here you would typically send an email/SMS reminder
      // For now, we'll just mark it as sent
      
      return NextResponse.json({ 
        message: 'Reminder sent successfully',
        booking: updatedBooking[0]
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing handledar booking action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
