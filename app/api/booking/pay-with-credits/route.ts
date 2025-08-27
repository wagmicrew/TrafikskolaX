import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, userCredits, invoices, invoiceItems } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, amount } = body;

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Booking ID and amount are required' }, { status: 400 });
    }

    // Get current user
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get user credits
    const userCreditRecords = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId));

    const totalCredits = userCreditRecords.reduce((sum, credit) => sum + credit.creditsRemaining, 0);

    if (totalCredits < amount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Update booking status
      await tx
        .update(bookings)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentMethod: 'credits',
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));

      // Deduct credits from user credit records (FIFO - first in, first out)
      let remainingAmount = amount;
      const sortedCredits = userCreditRecords
        .filter(credit => credit.creditsRemaining > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      for (const credit of sortedCredits) {
        if (remainingAmount <= 0) break;

        const deductAmount = Math.min(remainingAmount, credit.creditsRemaining);
        const newRemaining = credit.creditsRemaining - deductAmount;

        await tx
          .update(userCredits)
          .set({
            creditsRemaining: newRemaining,
            updatedAt: new Date()
          })
          .where(eq(userCredits.id, credit.id));

        remainingAmount -= deductAmount;
      }

      // Update invoice status
      const invoice = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.bookingId, bookingId))
        .limit(1);

      if (invoice.length > 0) {
        await tx
          .update(invoices)
          .set({
            status: 'paid',
            paymentMethod: 'credits',
            updatedAt: new Date()
          })
          .where(eq(invoices.id, invoice[0].id));
      }
    });

    console.log(`[CREDITS_PAYMENT] User ${userId} paid ${amount} credits for booking ${bookingId}`);

    return NextResponse.json({
      success: true,
      message: 'Payment completed successfully with credits'
    });

  } catch (error) {
    console.error('Error processing credit payment:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
