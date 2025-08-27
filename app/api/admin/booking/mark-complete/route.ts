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

    // Update booking status to completed
    const updatedBooking = await db
      .update(bookings)
      .set({
        status: 'completed',
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    if (updatedBooking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    console.log(`[ADMIN_MARK_COMPLETE] Booking ${bookingId} marked as completed`);

    return NextResponse.json({
      success: true,
      message: 'Booking marked as completed'
    });

  } catch (error) {
    console.error('Error marking booking as complete:', error);
    return NextResponse.json({ error: 'Failed to mark as complete' }, { status: 500 });
  }
}
