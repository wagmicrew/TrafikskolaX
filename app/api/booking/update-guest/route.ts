import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, guestName, guestEmail, guestPhone } = body;

    if (!bookingId || !guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the existing booking
    const [existingBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only allow updating temporary bookings with placeholder data
    if (existingBooking.status !== 'temp') {
      return NextResponse.json({ error: 'Can only update temporary bookings' }, { status: 400 });
    }

    // Check if this booking has placeholder guest info
    const hasPlaceholderData = existingBooking.guestEmail === 'guest@example.com' && 
                               existingBooking.guestName === 'Guest';

    if (!hasPlaceholderData && !existingBooking.isGuestBooking) {
      return NextResponse.json({ error: 'This booking does not have placeholder guest information' }, { status: 400 });
    }

    // Update the booking with real guest information
    const [updatedBooking] = await db
      .update(bookings)
      .set({
        guestName,
        guestEmail,
        guestPhone,
        isGuestBooking: true,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Guest information updated successfully'
    });

  } catch (error) {
    console.error('Error updating guest information:', error);
    return NextResponse.json({ error: 'Failed to update guest information' }, { status: 500 });
  }
}
