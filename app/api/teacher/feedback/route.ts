import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { userFeedback, bookings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { bookingId, stepIdentifier, feedbackText, valuation } = await request.json();

    if (!bookingId || !stepIdentifier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify that the booking belongs to this teacher
    const booking = await db
      .select({ 
        id: bookings.id, 
        userId: bookings.userId,
        teacherId: bookings.teacherId 
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking[0].teacherId !== (user.userId || user.id)) {
      return NextResponse.json({ error: 'Access denied - not your booking' }, { status: 403 });
    }

    // Check if feedback for this step already exists
    const existingFeedback = await db
      .select({ id: userFeedback.id })
      .from(userFeedback)
      .where(
        and(
          eq(userFeedback.bookingId, bookingId),
          eq(userFeedback.stepIdentifier, stepIdentifier)
        )
      )
      .limit(1);

    if (existingFeedback.length > 0) {
      // Update existing feedback
      await db
        .update(userFeedback)
        .set({
          feedbackText,
          valuation,
        })
        .where(eq(userFeedback.id, existingFeedback[0].id));
    } else {
      // Create new feedback
      await db.insert(userFeedback).values({
        bookingId,
        userId: booking[0].userId,
        stepIdentifier,
        feedbackText,
        valuation,
        isFromTeacher: true,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback saved successfully' 
    });
  } catch (error) {
    console.error('Error saving teacher feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
