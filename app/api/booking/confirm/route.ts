import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, sessionType, swishUUID, paymentMethod = 'swish' } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    if (sessionType === 'handledar') {
      // Handle handledar booking confirmation
      const [booking] = await db
        .select()
        .from(handledarBookings)
        .where(eq(handledarBookings.id, bookingId))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Only allow confirmation of pending bookings
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'Booking is not pending confirmation' }, { status: 400 });
      }

      // Update booking status to confirmed
      const [updatedBooking] = await db
        .update(handledarBookings)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentMethod,
          updatedAt: new Date()
        })
        .where(eq(handledarBookings.id, bookingId))
        .returning();

      // Send confirmation email
      if (booking.supervisorEmail) {
        await sendConfirmationNotification(booking.supervisorEmail, updatedBooking, true);
      } else if (booking.studentId) {
        const [student] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, booking.studentId))
          .limit(1);
        
        if (student) {
          await sendConfirmationNotification(student.email, updatedBooking, true);
        }
      }

      return NextResponse.json({
        booking: updatedBooking,
        message: 'Handledar booking confirmed successfully'
      });

    } else {
      // Handle regular lesson booking confirmation
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Only allow confirmation of temporary bookings
      if (booking.status !== 'temp') {
        return NextResponse.json({ error: 'Booking is not temporary' }, { status: 400 });
      }

      // Update booking status to confirmed
      const [updatedBooking] = await db
        .update(bookings)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentMethod,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId))
        .returning();

// Send confirmation email
      const { sendBookingConfirmationEmail } = await import('@/lib/email/booking-emails');
      if (booking.guestEmail) {
        await sendBookingConfirmationEmail({
          user: {
            id: '',
            email: booking.guestEmail,
            firstName: booking.guestName?.split(' ')[0] || 'Guest',
            lastName: booking.guestName?.split(' ').slice(1).join(' ') || '',
            role: 'guest'
          },
          booking: {
            id: updatedBooking.id,
            scheduledDate: updatedBooking.scheduledDate.toISOString().split('T')[0],
            startTime: updatedBooking.startTime,
            endTime: updatedBooking.endTime,
            lessonTypeName: 'Körlektion',
            totalPrice: updatedBooking.totalPrice?.toString() || '0',
            paymentMethod: updatedBooking.paymentMethod
          }
        });
      } else if (booking.userId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.userId))
          .limit(1);
        
        if (user) {
          await sendBookingConfirmationEmail({
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            },
            booking: {
              id: updatedBooking.id,
              scheduledDate: updatedBooking.scheduledDate.toISOString().split('T')[0],
              startTime: updatedBooking.startTime,
              endTime: updatedBooking.endTime,
              lessonTypeName: 'Körlektion',
              totalPrice: updatedBooking.totalPrice?.toString() || '0',
              paymentMethod: updatedBooking.paymentMethod
            }
          });
        }
      }

      return NextResponse.json({
        booking: updatedBooking,
        message: 'Booking confirmed successfully'
      });
    }

  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 });
  }
}

// Helper function to send confirmation notification
async function sendConfirmationNotification(email: string, booking: any, isHandledar: boolean = false) {
  try {
    // Use new email template service
    const { EmailService } = await import('@/lib/email/email-service');
    
    // Get user details for email context
    let userDetails = null;
    const userId = booking.userId || booking.studentId;
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      userDetails = user;
    }

    const emailContext = {
      user: userDetails ? {
        id: userDetails.id,
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        role: userDetails.role
      } : {
        id: '',
        email: email,
        firstName: booking.guestName?.split(' ')[0] || booking.supervisorName?.split(' ')[0] || 'Guest',
        lastName: booking.guestName?.split(' ').slice(1).join(' ') || booking.supervisorName?.split(' ').slice(1).join(' ') || '',
        role: 'student'
      },
      booking: {
        id: booking.id,
        scheduledDate: booking.scheduledDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        lessonTypeName: isHandledar ? 'Handledarutbildning' : 'Körlektion',
        totalPrice: booking.totalPrice?.toString() || booking.price?.toString() || '0',
        swishUUID: booking.swishUUID,
        paymentMethod: booking.paymentMethod
      }
    };

    // Send payment confirmation and booking confirmation emails
    await EmailService.sendTriggeredEmail('payment_confirmed', emailContext);
    await EmailService.sendTriggeredEmail('booking_confirmed', emailContext);

  } catch (error) {
    console.error('Failed to send confirmation notification:', error);
  }
}
