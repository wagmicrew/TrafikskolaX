import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, users, blockedSlots, invoices, invoiceItems, lessonTypes } from '@/lib/db/schema';
import { doTimeRangesOverlap } from '@/lib/utils/time-overlap';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, sessionType, swishUUID, paymentMethod = 'swish', guestName, guestEmail, guestPhone, studentId, studentName } = body;

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

      // Idempotent: if already processed, return success
      if (booking.status !== 'temp') {
        return NextResponse.json({
          booking,
          message: booking.paymentStatus === 'pending'
            ? 'Handledar booking already pending verification'
            : 'Handledar booking already processed'
        });
      }

      // Skipping blocked slot check here because handledar bookings reference session time via sessionId

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
        // Mark booking as confirmed even if payment is pending
        updateData.status = 'confirmed';
        updateData.paymentStatus = 'pending';
      } else if (paymentMethod === 'credits') {
        // Credits: mark fully confirmed and paid
        updateData.status = 'confirmed';
        updateData.paymentStatus = 'confirmed';
      } else if (paymentMethod === 'pay_at_location') {
        updateData.status = 'confirmed';
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

      // Idempotent: if already processed, return success
      if (booking.status !== 'temp') {
        return NextResponse.json({
          booking,
          message: booking.paymentStatus === 'pending'
            ? 'Booking already pending verification'
            : 'Booking already processed'
        });
      }

      // Ensure not confirming into a blocked time (safety check)
      const blocked = await db.select().from(blockedSlots).where(eq(blockedSlots.date, booking.scheduledDate));
      const allDayBlocked = blocked.some(b => b.isAllDay);
      const timeBlocked = blocked.some(b => b.timeStart && b.timeEnd && doTimeRangesOverlap(booking.startTime, booking.endTime, b.timeStart, b.timeEnd));
      if (allDayBlocked || timeBlocked) {
        return NextResponse.json({ error: 'Tiden är blockerad. Kan inte bekräfta bokning.' }, { status: 400 });
      }

      // Update booking with student information and payment status
      const updateData: any = {
        paymentMethod,
        updatedAt: new Date()
      };

      // If a student is selected, update the booking with student information
      if (studentId) {
        updateData.userId = studentId;
        updateData.isGuestBooking = false;
        updateData.guestName = null;
        updateData.guestEmail = null;
        updateData.guestPhone = null;
      } else {
        // Update guest information if provided (fallback for guest bookings)
        if (guestName) updateData.guestName = guestName;
        if (guestEmail) updateData.guestEmail = guestEmail;
        if (guestPhone) updateData.guestPhone = guestPhone;
        updateData.isGuestBooking = true;
      }

      // Handle different payment methods
      if (paymentMethod === 'swish') {
        // Mark booking as confirmed even if payment is pending
        updateData.status = 'confirmed';
        updateData.paymentStatus = 'pending';
      } else if (paymentMethod === 'credits') {
        // Credits: mark fully confirmed and paid
        updateData.status = 'confirmed';
        updateData.paymentStatus = 'confirmed';
      } else if (paymentMethod === 'pay_at_location') {
        updateData.status = 'confirmed';
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

      // Create invoice for regular lesson bookings
      let invoice = null;
      try {
        // Get student details for invoice - use selected student if available
        let studentDetails = null;
        let customerId = studentId || updatedBooking.userId;

        if (customerId) {
          const student = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              phone: users.phone
            })
            .from(users)
            .where(eq(users.id, customerId))
            .limit(1);

          if (student.length > 0) {
            studentDetails = student[0];
          }
        }

        // Get lesson type details for invoice
        let lessonTypeDetails = null;
        if (updatedBooking.lessonTypeId) {
          const lessonType = await db
            .select({
              id: lessonTypes.id,
              name: lessonTypes.name,
              description: lessonTypes.description
            })
            .from(lessonTypes)
            .where(eq(lessonTypes.id, updatedBooking.lessonTypeId))
            .limit(1);

          if (lessonType.length > 0) {
            lessonTypeDetails = lessonType[0];
          }
        }

        // Create invoice
        const invoiceNumber = `INV-${Date.now()}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

        const invoiceData = await db
          .insert(invoices)
          .values({
            invoiceNumber: invoiceNumber,
            bookingId: updatedBooking.id,
            customerId: customerId,
            customerName: studentDetails ? `${studentDetails.firstName} ${studentDetails.lastName}` : studentName || guestName || 'Unknown',
            customerEmail: studentDetails?.email || guestEmail || null,
            amount: updatedBooking.totalPrice,
            status: 'pending',
            dueDate: dueDate,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        if (invoiceData.length > 0) {
          invoice = invoiceData[0];

          // Create invoice item
          await db
            .insert(invoiceItems)
            .values({
              invoiceId: invoice.id,
              description: `Körlektion - ${lessonTypeDetails?.name || 'Körlektion'} - ${new Date(updatedBooking.scheduledDate).toLocaleDateString('sv-SE')}`,
              quantity: 1,
              unitPrice: updatedBooking.totalPrice,
              amount: updatedBooking.totalPrice,
              itemType: 'lesson',
              itemReference: updatedBooking.lessonTypeId || updatedBooking.id
            });
        }
      } catch (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        // Continue with booking confirmation even if invoice creation fails
      }

      // Send booking confirmation email with payment link
      let emailTo = null;

      if (studentDetails?.email) {
        // Send to selected student
        emailTo = studentDetails.email;
      } else if (guestEmail) {
        // Send to guest email
        emailTo = guestEmail;
      } else if (booking.guestEmail) {
        // Send to existing guest email
        emailTo = booking.guestEmail;
      } else if (updatedBooking.userId) {
        // Get email from updated booking user
        emailTo = await getUserEmail(updatedBooking.userId);
      }

      if (emailTo) {
        await sendBookingConfirmationNotification(emailTo, updatedBooking, false, paymentMethod === 'swish');
      }

      return NextResponse.json({
        booking: updatedBooking,
        invoice: invoice,
        message: paymentMethod === 'swish' ?
          'Booking confirmed. Payment verification pending.' :
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

// Helper function to send booking confirmation notification
async function sendBookingConfirmationNotification(email: string, booking: any, isHandledar: boolean = false, isSwishPayment: boolean = false) {
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

    // Generate payment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/booking/payment/${booking.id}`;

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
        firstName: booking.guestName?.split(' ')[0] || booking.supervisorName?.split(' ')[0] || 'Kund',
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
      },
      customData: {
        paymentUrl: paymentUrl,
        isSwishPayment: isSwishPayment
      }
    };

    // Send booking confirmation email
    await EmailService.sendTriggeredEmail('booking_confirmed_payment', emailContext);

  } catch (error) {
    console.error('Failed to send booking confirmation notification:', error);
  }
}

// Helper function to send Swish payment notification
async function sendSwishPaymentNotification(booking: any, isHandledar: boolean = false) {
  try {
    const { EmailService } = await import('@/lib/email/email-service');
    const jwt = (await import('jsonwebtoken')).default as typeof import('jsonwebtoken');
    const { siteSettings } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    const { db } = await import('@/lib/db');
    
    let userDetails = null;
    const userId = booking.userId || booking.studentId;
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      userDetails = user;
    }

    // Generate signed admin action URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret';
    const payloadBase = {
      type: 'swish_action',
      bookingId: booking.id,
      sessionType: isHandledar ? 'handledar' : 'regular',
    } as const;
    const approveToken = jwt.sign({ ...payloadBase, decision: 'confirm' }, jwtSecret, { expiresIn: '30m' });
    const denyToken = jwt.sign({ ...payloadBase, decision: 'deny' }, jwtSecret, { expiresIn: '30m' });
    const adminApproveUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(approveToken)}`;
    const adminDenyUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(denyToken)}`;

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
      },
      customData: {
        adminApproveUrl,
        adminDenyUrl,
        adminActionButtons: `
          <div style="text-align:center;margin:24px 0;">
            <a href="${adminApproveUrl}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;margin-right:8px;">Bekräfta betalning</a>
            <a href="${adminDenyUrl}" style="background:#dc2626;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;">Ingen betalning mottagen</a>
          </div>`
      }
    };

    await EmailService.sendTriggeredEmail('swish_payment_verification', emailContext);
  } catch (error) {
    console.error('Failed to send Swish payment notification:', error);
  }
}
