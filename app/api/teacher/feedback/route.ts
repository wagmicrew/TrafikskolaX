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

    const { bookingId, stepIdentifier, feedbackText, valuation, isFreetext = false } = await request.json();

    if (!bookingId || (!stepIdentifier && !isFreetext) || !feedbackText) {
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

    if (booking[0].teacherId !== user.userId) {
      return NextResponse.json({ error: 'Access denied - not your booking' }, { status: 403 });
    }

    // For freetext feedback, use a special identifier
    const finalStepIdentifier = isFreetext ? 'freetext' : stepIdentifier;

    // Check if feedback for this step already exists
    const existingFeedback = await db
      .select({ id: userFeedback.id })
      .from(userFeedback)
      .where(
        and(
          eq(userFeedback.bookingId, bookingId),
          eq(userFeedback.stepIdentifier, finalStepIdentifier)
        )
      )
      .limit(1);

    if (existingFeedback.length > 0) {
      // Update existing feedback
      await db
        .update(userFeedback)
        .set({
          feedbackText,
          valuation: valuation || null,
        })
        .where(eq(userFeedback.id, existingFeedback[0].id));
    } else {
      // Create new feedback
      await db.insert(userFeedback).values({
        bookingId,
        userId: booking[0].userId,
        stepIdentifier: finalStepIdentifier,
        feedbackText,
        valuation: valuation || null,
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

// GET - Fetch existing feedback for a booking
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Verify that the booking belongs to this teacher
    const booking = await db
      .select({ 
        id: bookings.id, 
        teacherId: bookings.teacherId 
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking[0].teacherId !== user.userId) {
      return NextResponse.json({ error: 'Access denied - not your booking' }, { status: 403 });
    }

    // Fetch existing feedback for this booking
    const existingFeedback = await db
      .select({
        id: userFeedback.id,
        stepIdentifier: userFeedback.stepIdentifier,
        feedbackText: userFeedback.feedbackText,
        valuation: userFeedback.valuation,
        isFromTeacher: userFeedback.isFromTeacher,
        createdAt: userFeedback.createdAt,
      })
      .from(userFeedback)
      .where(eq(userFeedback.bookingId, bookingId));

    return NextResponse.json({ 
      feedback: existingFeedback
    });
  } catch (error) {
    console.error('Error fetching teacher feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
