import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, sessionType, confirmed } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Verify admin permissions
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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

      // Only allow confirmation of payment_avvaktande bookings
      if (booking.status !== 'payment_avvaktande') {
        return NextResponse.json({ error: 'Booking is not waiting for payment confirmation' }, { status: 400 });
      }

      if (confirmed) {
        // Confirm the payment
        const [updatedBooking] = await db
          .update(handledarBookings)
          .set({
            status: 'confirmed',
            paymentStatus: 'paid',
            updatedAt: new Date()
          })
          .where(eq(handledarBookings.id, bookingId))
          .returning();

        // Send confirmation email to student/supervisor
        const emailTo = booking.supervisorEmail || (booking.studentId ? await getUserEmail(booking.studentId) : null);
        if (emailTo) {
          await sendConfirmationNotification(emailTo, updatedBooking, true);
        }

        return NextResponse.json({
          booking: updatedBooking,
          message: 'Swish payment confirmed successfully'
        });
      } else {
        // Decline the payment
        const [updatedBooking] = await db
          .update(handledarBookings)
          .set({
            status: 'cancelled',
            paymentStatus: 'failed',
            updatedAt: new Date()
          })
          .where(eq(handledarBookings.id, bookingId))
          .returning();

        return NextResponse.json({
          booking: updatedBooking,
          message: 'Swish payment declined'
        });
      }

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

      // Only allow confirmation of payment_avvaktande bookings
      if (booking.status !== 'payment_avvaktande') {
        return NextResponse.json({ error: 'Booking is not waiting for payment confirmation' }, { status: 400 });
      }

      if (confirmed) {
        // Confirm the payment
        const [updatedBooking] = await db
          .update(bookings)
          .set({
            status: 'confirmed',
            paymentStatus: 'paid',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, bookingId))
          .returning();

        // Send confirmation email to student/guest
        const emailTo = booking.guestEmail || (booking.userId ? await getUserEmail(booking.userId) : null);
        if (emailTo) {
          await sendConfirmationNotification(emailTo, updatedBooking, false);
        }

        return NextResponse.json({
          booking: updatedBooking,
          message: 'Swish payment confirmed successfully'
        });
      } else {
        // Decline the payment
        const [updatedBooking] = await db
          .update(bookings)
          .set({
            status: 'cancelled',
            paymentStatus: 'failed',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, bookingId))
          .returning();

        return NextResponse.json({
          booking: updatedBooking,
          message: 'Swish payment declined'
        });
      }
    }

  } catch (error) {
    console.error('Error confirming Swish payment:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}

// Helper function to get user email by ID
async function getUserEmail(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ? user.email : null;
}

// Helper function to send confirmation notification
async function sendConfirmationNotification(email: string, booking: any, isHandledar: boolean = false) {
  try {
    const { EmailService } = await import('@/lib/email/email-service');
    
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
        email: booking.supervisorEmail || booking.guestEmail || 'Guest',
        firstName: booking.supervisorName?.split(' ')[0] || booking.guestName?.split(' ')[0] || 'Guest',
        lastName: booking.supervisorName?.split(' ').slice(1).join(' ') || booking.guestName?.split(' ').slice(1).join(' ') || '',
        role: 'guest'
      },
      booking: {
        id: booking.id,
        scheduledDate: booking.scheduledDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        lessonTypeName: isHandledar ? 'Handledarutbildning' : 'Körlektion',
        totalPrice: booking.totalPrice?.toString() || booking.price?.toString() || '0',
        paymentMethod: booking.paymentMethod
      }
    };

    await EmailService.sendTriggeredEmail('booking_confirmed', emailContext);
  } catch (error) {
    console.error('Failed to send confirmation notification:', error);
  }
} 