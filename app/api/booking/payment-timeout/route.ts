import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, invoices, invoiceItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, invoiceId, reason = 'Payment timeout - 120 minutes expired' } = await request.json();

    if (!bookingId || !invoiceId) {
      return NextResponse.json(
        { error: 'Booking ID and Invoice ID are required' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    await db.transaction(async (tx) => {
      // 1. Cancel the invoice
      await tx
        .update(invoices)
        .set({
          status: 'cancelled',
          notes: reason,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));

      // 2. Cancel the booking
      await tx
        .update(bookings)
        .set({
          status: 'cancelled',
          paymentStatus: 'cancelled',
          notes: reason,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));

      // 3. Log the cleanup action
      console.log(`Payment timeout cleanup completed: Booking ${bookingId}, Invoice ${invoiceId}`);
    });

    return NextResponse.json({
      success: true,
      message: 'Payment timeout cleanup completed successfully'
    });

  } catch (error) {
    console.error('Payment timeout cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment timeout cleanup' },
      { status: 500 }
    );
  }
}

