import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, internalMessages } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, userId } = await request.json();

    // Create an internal message for the payment confirmation
    const message = {
      fromUserId: userId,
      toUserId: null, // Admin or designated email group
      subject: 'Payment Confirmation for Booking',
      message: `The user has confirmed payment for booking ID: ${bookingId}`,
      messageType: 'payment_confirmation',
      bookingId,
    };

    await db.insert(internalMessages).values(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    const bookingDetails = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        totalPrice: bookings.totalPrice,
        notes: bookings.notes,
      })
      .from(bookings)
      .where(and(
        eq(bookings.id, bookingId),
        isNull(bookings.deletedAt)
      ));

    if (bookingDetails.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking: bookingDetails[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
