import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes, userCredits } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export async function POST(request: NextRequest) {
  try {
    // Ensure admin access
    await requireAuth('admin');

    const { bookingIds } = await request.json();

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Booking IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch bookings with user and lesson type information
    const bookingsToUnbook = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        lessonTypeId: bookings.lessonTypeId,
        lessonTypeName: lessonTypes.name,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(inArray(bookings.id, bookingIds));

    if (bookingsToUnbook.length === 0) {
      return NextResponse.json(
        { error: 'No valid bookings found' },
        { status: 404 }
      );
    }

    const results = [];

    // Process each booking
    for (const booking of bookingsToUnbook) {
      try {
        await db.transaction(async (tx) => {
          // 1. Update booking status to cancelled
          await tx
            .update(bookings)
            .set({ 
              status: 'cancelled',
              updatedAt: new Date()
            })
            .where(eq(bookings.id, booking.id));

          // 2. Reimburse credits if user is logged in
          if (booking.userId && booking.lessonTypeId) {
            // Add credit for the lesson type
            await tx
              .insert(userCredits)
              .values({
                userId: booking.userId,
                creditType: 'lesson',
                lessonTypeId: booking.lessonTypeId,
                creditsRemaining: 1,
                creditsTotal: 1
              });
          }

          // 3. Send unbook email
          const emailAddress = booking.userEmail || booking.guestEmail;
          if (emailAddress) {
            const emailData = {
              to: emailAddress,
              subject: 'Din bokning har avbokats',
              template: 'booking-cancelled',
              context: {
                userName: booking.userName ? `${booking.userName} ${booking.userLastName}` : booking.guestName,
                lessonType: booking.lessonTypeName,
                scheduledDate: new Date(booking.scheduledDate).toLocaleDateString('sv-SE'),
                startTime: booking.startTime,
                endTime: booking.endTime,
                creditReimbursed: booking.userId ? 'Ja' : 'Nej (gästbokning)'
              }
            };

            await sendEmail(emailData);
          }

          results.push({
            bookingId: booking.id,
            success: true,
            emailSent: true,
            creditReimbursed: !!booking.userId
          });

        });
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
        results.push({
          bookingId: booking.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successfulBookings = results.filter(r => r.success).length;
    const failedBookings = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Successfully unbooked ${successfulBookings} bookings${failedBookings > 0 ? `, ${failedBookings} failed` : ''}`,
      results,
      summary: {
        total: bookingIds.length,
        successful: successfulBookings,
        failed: failedBookings
      }
    });

  } catch (error) {
    console.error('Error in bulk unbook:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk unbook' },
      { status: 500 }
    );
  }
}
