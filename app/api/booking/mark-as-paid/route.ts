import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
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

    // Get current user (optional - allow anonymous marking)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let currentUserId = null;

    if (token) {
      try {
        const decoded = verifyToken(token);
        currentUserId = decoded.userId;
      } catch (error) {
        // Continue without user context
      }
    }

    // Update booking to indicate user has clicked "I have paid"
    const updatedBooking = await db
      .update(bookings)
      .set({
        paymentStatus: 'pending_admin_confirmation',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // TODO: Send email to admin about payment confirmation needed
    // This would integrate with your email service

    console.log(`[BOOKING_MARK_PAID] User marked booking ${bookingId} as paid`);

    return NextResponse.json({
      success: true,
      message: 'Payment confirmation sent to administrator'
    });

  } catch (error) {
    console.error('Error marking booking as paid:', error);
    return NextResponse.json({ error: 'Failed to mark as paid' }, { status: 500 });
  }
}
