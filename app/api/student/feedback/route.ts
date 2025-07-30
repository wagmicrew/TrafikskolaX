import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { userFeedback, bookings } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch all feedback for the student's bookings
    const rawFeedback = await db
      .select({
        id: userFeedback.id,
        bookingId: userFeedback.bookingId,
        feedbackText: userFeedback.feedbackText,
        rating: userFeedback.rating,
        valuation: userFeedback.valuation,
        stepIdentifier: userFeedback.stepIdentifier,
        isFromTeacher: userFeedback.isFromTeacher,
        createdAt: userFeedback.createdAt,
        scheduledDate: bookings.scheduledDate,
        lessonTypeId: bookings.lessonTypeId,
      })
      .from(userFeedback)
      .innerJoin(bookings, eq(userFeedback.bookingId, bookings.id))
      .where(eq(bookings.userId, user.userId || user.id))
      .orderBy(desc(userFeedback.createdAt));

    // Group feedback by booking
    const groupedFeedback = rawFeedback.reduce((acc, item) => {
      const existingBooking = acc.find(booking => booking.bookingId === item.bookingId);
      
      if (existingBooking) {
        existingBooking.feedback.push({
          id: item.id,
          stepIdentifier: item.stepIdentifier,
          feedbackText: item.feedbackText,
          valuation: item.valuation,
          rating: item.rating
        });
      } else {
        acc.push({
          bookingId: item.bookingId,
          scheduledDate: item.scheduledDate,
          lessonTypeId: item.lessonTypeId,
          lessonTypeName: 'Körlektion', // You might want to join with lessonTypes table for actual name
          feedback: [{
            id: item.id,
            stepIdentifier: item.stepIdentifier,
            feedbackText: item.feedbackText,
            valuation: item.valuation,
            rating: item.rating
          }]
        });
      }
      return acc;
    }, []);

    return NextResponse.json({ 
      feedback: groupedFeedback,
      total: groupedFeedback.length 
    });
  } catch (error) {
    console.error('Error fetching student feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
