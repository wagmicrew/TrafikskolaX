import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, internalMessages, users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuthAPI, getServerUser } from '@/lib/auth/server-auth';
import { sendCancellationNotification } from '@/lib/mailer/universal-mailer';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, userId } = await request.json();

    // Find admin user to send notification to
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    
    // Create an internal message for the payment confirmation
    const message = {
      fromUserId: userId,
      toUserId: adminUsers.length > 0 ? adminUsers[0].id : userId, // Use admin if available, otherwise self
      subject: 'Payment Confirmation for Booking',
      message: `The user has confirmed payment for booking ID: ${bookingId}`,
      messageType: 'payment_confirmation',
      bookingId,
    };

    await db.insert(internalMessages).values(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    const bookingDetails = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        totalPrice: bookings.totalPrice,
        notes: bookings.notes,
      })
      .from(bookings)
      .where(and(
        eq(bookings.id, bookingId),
        isNull(bookings.deletedAt)
      ));

    if (bookingDetails.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking: bookingDetails[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE endpoint for cancelling bookings
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id;
    console.log(`Attempting to cancel booking with ID: ${bookingId}`);
    
    // Get cancellation reason from request body if provided
    const body = await request.json().catch(() => ({}));
    const cancellationReason = body.reason || 'No reason provided';
    
    // Get the current user using getServerUser from server-auth
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const currentUser = auth.user;

    // Check if booking exists and belongs to current user (for student users)
    const existingBooking = await db
      .select()
      .from(bookings)
      .where(and(
        eq(bookings.id, bookingId),
        isNull(bookings.deletedAt)
      ));

    if (existingBooking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // For security, ensure only booking owner or admin can cancel
    const isAdmin = currentUser.role === 'admin';
    const isOwner = existingBooking[0].userId === currentUser.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'You are not authorized to cancel this booking' }, { status: 403 });
    }

    // Check if the booking is already cancelled
    if (existingBooking[0].status === 'cancelled') {
      return NextResponse.json({ error: 'This booking is already cancelled' }, { status: 400 });
    }

    // Check for cancellation timeframe rules (e.g. can't cancel within 24h)
    // This is a business rule you may want to implement
    const bookingDateTime = new Date(`${existingBooking[0].scheduledDate}T${existingBooking[0].startTime}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Example rule: Can't cancel if less than 24h before booking
    if (hoursUntilBooking < 24 && !isAdmin) {
      return NextResponse.json({
        error: 'Bookings must be cancelled at least 24 hours in advance',
        hoursRemaining: 24 - hoursUntilBooking
      }, { status: 400 });
    }

    // Update booking status to cancelled
    const cancellationNote = `Cancelled by ${currentUser.firstName || currentUser.email} (${currentUser.id}) on ${new Date().toISOString()}\nReason: ${cancellationReason}`;
    
    const result = await db
      .update(bookings)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
        notes: existingBooking[0].notes 
          ? `${existingBooking[0].notes}\n${cancellationNote}`
          : cancellationNote
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Find admin user to send notification to
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    
    const adminUserId = adminUsers.length > 0 ? adminUsers[0].id : currentUser.id; // Fall back to self if no admin
    
    // Create an internal message about the cancellation
    await db.insert(internalMessages).values({
      fromUserId: currentUser.id,
      toUserId: adminUserId, // Send to an admin or self if no admin found
      subject: 'Booking Cancelled',
      message: `Booking ID: ${bookingId} was cancelled by ${currentUser.firstName || currentUser.email} (${currentUser.id})\nReason: ${cancellationReason}`,
      messageType: 'booking_cancelled',
      bookingId,
    });

    // Format date and time for email notification
    const formattedDate = new Date(existingBooking[0].scheduledDate).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Send email notification to the student
    try {
      // Get student email
      const studentData = await db
        .select({ email: users.email, firstName: users.firstName })
        .from(users)
        .where(eq(users.id, existingBooking[0].userId))
        .limit(1);
      
      if (studentData.length > 0) {
        await sendCancellationNotification(studentData[0].email, {
          lessonType: existingBooking[0].lessonTypeId || 'Lektion',
          date: formattedDate,
          time: `${existingBooking[0].startTime} - ${existingBooking[0].endTime}`,
          reason: cancellationReason
        });
      }
      
      // Send notification to admin as well
      const adminEmails = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.role, 'admin'));
      
      // Send to all admins
      for (const admin of adminEmails) {
        await sendCancellationNotification(admin.email, {
          lessonType: existingBooking[0].lessonTypeId || 'Lektion',
          date: formattedDate,
          time: `${existingBooking[0].startTime} - ${existingBooking[0].endTime}`,
          reason: cancellationReason
        });
      }
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
      console.error('Error sending cancellation notification emails:', errorMessage);
      // Don't return an error, just log it - we've already cancelled the booking successfully
    }
    
    console.log(`Booking cancelled successfully: ${bookingId}`);
    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: result[0]
    });

  } catch (error: unknown) {
    console.error('Error cancelling booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: 'Failed to cancel booking', 
      details: errorMessage
    }, { status: 500 });
  }
}
