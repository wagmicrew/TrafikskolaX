import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, invoices, blockedSlots } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Verify admin permissions
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get booking details before deletion
    const booking = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalPrice: bookings.totalPrice,
        guestEmail: bookings.guestEmail,
        guestName: bookings.guestName
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];

    // Start transaction to handle all related updates
    await db.transaction(async (tx) => {
      // Cancel invoice
      const invoice = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.bookingId, bookingId))
        .limit(1);

      if (invoice.length > 0) {
        await tx
          .update(invoices)
          .set({
            status: 'cancelled',
            updatedAt: new Date()
          })
          .where(eq(invoices.id, invoice[0].id));
      }

      // Delete booking (this will cascade to bookingSupervisorDetails if configured)
      await tx
        .delete(bookings)
        .where(eq(bookings.id, bookingId));
    });

    // Send decline email to customer
    // TODO: Integrate with your email service
    console.log(`[ADMIN_DECLINE_ORDER] Declined order ${bookingId}`);
    console.log(`Customer: ${bookingData.userId ? 'Registered user' : bookingData.guestEmail || 'No email'}`);
    console.log(`Lesson: ${bookingData.scheduledDate} ${bookingData.startTime}-${bookingData.endTime}`);
    console.log(`Amount: ${bookingData.totalPrice} kr`);

    return NextResponse.json({
      success: true,
      message: 'Order declined and time slot released'
    });

  } catch (error) {
    console.error('Error declining order:', error);
    return NextResponse.json({ error: 'Failed to decline order' }, { status: 500 });
  }
}
