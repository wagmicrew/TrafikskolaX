import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { bookings, users, userCredits } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const bookingId = params.bookingId;

    // Verify that the booking exists and belongs to this teacher
    const booking = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        teacherId: bookings.teacherId,
        status: bookings.status,
        totalPrice: bookings.totalPrice,
        durationMinutes: bookings.durationMinutes,
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

    if (booking[0].status === 'cancelled' || booking[0].status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot cancel a booking that is already cancelled or completed' 
      }, { status: 400 });
    }

    // Start a transaction to update booking and add credit
    await db.transaction(async (tx) => {
      // Update the booking status to cancelled
      await tx
        .update(bookings)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      // Add credits for the student based on the booking duration
      // Note: This assumes we have a lessonTypeId from the booking to add credits
      // If the booking doesn't have lessonTypeId, we'll need to get it first
      const bookingDetails = await tx
        .select({ lessonTypeId: bookings.lessonTypeId })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);
        
      if (bookingDetails.length > 0 && bookingDetails[0].lessonTypeId) {
        // Check if user already has credits for this lesson type
        const existingCredits = await tx
          .select()
          .from(userCredits)
          .where(
            and(
              eq(userCredits.userId, booking[0].userId!),
              eq(userCredits.lessonTypeId, bookingDetails[0].lessonTypeId)
            )
          )
          .limit(1);
          
        if (existingCredits.length > 0) {
          // Update existing credits
          await tx
            .update(userCredits)
            .set({
              creditsRemaining: existingCredits[0].creditsRemaining + (booking[0].durationMinutes || 0),
              creditsTotal: existingCredits[0].creditsTotal + (booking[0].durationMinutes || 0),
              updatedAt: new Date(),
            })
            .where(eq(userCredits.id, existingCredits[0].id));
        } else {
          // Create new credit entry
          await tx.insert(userCredits).values({
            userId: booking[0].userId!,
            lessonTypeId: bookingDetails[0].lessonTypeId,
            creditsRemaining: booking[0].durationMinutes || 0,
            creditsTotal: booking[0].durationMinutes || 0,
          });
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled and credit issued to student' 
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
