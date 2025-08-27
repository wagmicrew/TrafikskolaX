import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback, bookings, bookingSteps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth: require admin
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Fetch feedback for a specific booking with step details
    const feedback = await db
      .select({
        id: userFeedback.id,
        stepIdentifier: userFeedback.stepIdentifier,
        feedbackText: userFeedback.feedbackText,
        rating: userFeedback.rating,
        valuation: userFeedback.valuation,
        isFromTeacher: userFeedback.isFromTeacher,
        createdAt: userFeedback.createdAt,
        stepName: bookingSteps.name,
        stepCategory: bookingSteps.category,
      })
      .from(userFeedback)
      .leftJoin(bookingSteps, eq(userFeedback.stepIdentifier, bookingSteps.identifier))
      .where(eq(userFeedback.bookingId, id))
      .orderBy(userFeedback.createdAt);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth: require admin
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: bookingId } = await params;
    const { stepIdentifier, feedbackText, valuation, rating } = await request.json();

    if (!stepIdentifier || !feedbackText || valuation === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify booking exists and get lesson start time
    const booking = await db
      .select({
        id: bookings.id,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        status: bookings.status
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if lesson has started (only allow feedback after lesson start)
    const now = new Date();
    const lessonStart = new Date(`${booking[0].scheduledDate}T${booking[0].startTime}`);

    if (now < lessonStart) {
      return NextResponse.json({
        error: 'Feedback can only be added after the lesson has started'
      }, { status: 400 });
    }

    // Check if feedback for this step already exists from admin
    const existingFeedback = await db
      .select({ id: userFeedback.id })
      .from(userFeedback)
      .where(
        and(
          eq(userFeedback.bookingId, bookingId),
          eq(userFeedback.stepIdentifier, stepIdentifier),
          eq(userFeedback.isFromTeacher, false) // Admin feedback
        )
      )
      .limit(1);

    if (existingFeedback.length > 0) {
      return NextResponse.json({ error: 'Feedback already exists for this step' }, { status: 400 });
    }

    // Create new feedback
    const newFeedback = await db
      .insert(userFeedback)
      .values({
        bookingId,
        userId: auth.user.id,
        stepIdentifier,
        feedbackText,
        valuation,
        rating: rating || null,
        isFromTeacher: false, // Admin feedback
      })
      .returning();

    return NextResponse.json({
      success: true,
      feedback: newFeedback[0],
      message: 'Feedback saved successfully'
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
