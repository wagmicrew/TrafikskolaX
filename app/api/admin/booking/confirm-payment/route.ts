import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, invoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

    // Update booking status
    const updatedBooking = await db
      .update(bookings)
      .set({
        paymentStatus: 'paid',
        status: 'confirmed',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update invoice status
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.bookingId, bookingId))
      .limit(1);

    if (invoice.length > 0) {
      await db
        .update(invoices)
        .set({
          status: 'paid',
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoice[0].id));
    }

    // TODO: Send confirmation email to customer
    console.log(`[ADMIN_CONFIRM_PAYMENT] Admin confirmed payment for booking ${bookingId}`);

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
