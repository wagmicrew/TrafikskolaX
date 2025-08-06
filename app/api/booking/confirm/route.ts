import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, sessionType, swishUUID, paymentMethod = 'swish', guestName, guestEmail, guestPhone } = body;

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

      // Only allow confirmation of temporary bookings
      if (booking.status !== 'temp') {
        return NextResponse.json({ error: 'Booking is not temporary' }, { status: 400 });
      }

      // Update booking with guest information and payment status
      const updateData: any = {
        paymentMethod,
        updatedAt: new Date()
      };

      // Update guest information if provided
      if (guestName) updateData.supervisorName = guestName;
      if (guestEmail) updateData.supervisorEmail = guestEmail;
      if (guestPhone) updateData.supervisorPhone = guestPhone;

      // Handle different payment methods
      if (paymentMethod === 'swish') {
        updateData.status = 'payment_avvaktande';
        updateData.paymentStatus = 'pending';
      } else {
        updateData.status = 'confirmed';
        updateData.paymentStatus = 'paid';
      }

      const [updatedBooking] = await db
        .update(handledarBookings)
        .set(updateData)
        .where(eq(handledarBookings.id, bookingId))
        .returning();

      // Send appropriate notification based on payment method
      if (paymentMethod === 'swish') {
        // Send email to school for Swish payment verification
        await sendSwishPaymentNotification(updatedBooking, true);
      } else {
        // Send confirmation email to student/supervisor
        const emailTo = guestEmail || booking.supervisorEmail || (booking.studentId ? await getUserEmail(booking.studentId) : null);
        if (emailTo) {
          await sendConfirmationNotification(emailTo, updatedBooking, true);
        }
      }

      return NextResponse.json({
        booking: updatedBooking,
        message: paymentMethod === 'swish' ? 
          'Handledar booking updated. Payment verification pending.' :
          'Handledar booking confirmed successfully'
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

      // Update booking with guest information and payment status
      const updateData: any = {
        paymentMethod,
        updatedAt: new Date()
      };

      // Update guest information if provided
      if (guestName) updateData.guestName = guestName;
      if (guestEmail) updateData.guestEmail = guestEmail;
      if (guestPhone) updateData.guestPhone = guestPhone;

      // Handle different payment methods
      if (paymentMethod === 'swish') {
        updateData.status = 'payment_avvaktande';
        updateData.paymentStatus = 'pending';
      } else {
        updateData.status = 'confirmed';
        updateData.paymentStatus = 'paid';
      }

      const [updatedBooking] = await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, bookingId))
        .returning();

      // Send appropriate notification based on payment method
      if (paymentMethod === 'swish') {
        // Send email to school for Swish payment verification
        await sendSwishPaymentNotification(updatedBooking, false);
      } else {
        // Send confirmation email to student/guest
        const emailTo = guestEmail || booking.guestEmail || (booking.userId ? await getUserEmail(booking.userId) : null);
        if (emailTo) {
          await sendConfirmationNotification(emailTo, updatedBooking, false);
        }
      }

      return NextResponse.json({
        booking: updatedBooking,
        message: paymentMethod === 'swish' ? 
          'Booking updated. Payment verification pending.' :
          'Booking confirmed successfully'
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

// Helper function to get user email by ID
async function getUserEmail(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ? user.email : null;
}

// Helper function to send Swish payment notification
async function sendSwishPaymentNotification(booking: any, isHandledar: boolean = false) {
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
        email: booking.supervisorEmail || booking.guestEmail || 'School',
        firstName: booking.supervisorName?.split(' ')[0] || booking.guestName?.split(' ')[0] || 'School',
        lastName: booking.supervisorName?.split(' ').slice(1).join(' ') || booking.guestName?.split(' ').slice(1).join(' ') || '',
        role: 'school'
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

    await EmailService.sendTriggeredEmail('swish_payment_verification', emailContext);
  } catch (error) {
    console.error('Failed to send Swish payment notification:', error);
  }
}
