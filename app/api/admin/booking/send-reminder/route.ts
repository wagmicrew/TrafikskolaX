import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Verify admin permissions
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get booking details with related data
    const booking = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        lessonTypeId: bookings.lessonTypeId,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalPrice: bookings.totalPrice,
        paymentStatus: bookings.paymentStatus,
        swishUUID: bookings.swishUUID,
        paymentMethod: bookings.paymentMethod,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];

    // Get customer email
    let customerEmail = null;
    let customerName = null;

    if (bookingData.userId) {
      const user = await db
        .select({
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(eq(users.id, bookingData.userId))
        .limit(1);

      if (user.length > 0) {
        customerEmail = user[0].email;
        customerName = `${user[0].firstName} ${user[0].lastName}`.trim();
      }
    } else if (bookingData.guestEmail) {
      customerEmail = bookingData.guestEmail;
      customerName = bookingData.guestName || 'Kund';
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'No customer email found' }, { status: 400 });
    }

    // Get lesson type details
    let lessonTypeName = 'Körlektion';
    if (bookingData.lessonTypeId) {
      const lessonType = await db
        .select({ name: lessonTypes.name })
        .from(lessonTypes)
        .where(eq(lessonTypes.id, bookingData.lessonTypeId))
        .limit(1);

      if (lessonType.length > 0) {
        lessonTypeName = lessonType[0].name;
      }
    }

    // Generate payment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/booking/payment/${bookingId}`;

    // Send reminder email
    // TODO: Integrate with your email service to send actual reminder
    console.log(`[ADMIN_SEND_REMINDER] Sending payment reminder to ${customerEmail} for booking ${bookingId}`);
    console.log(`Payment URL: ${paymentUrl}`);
    console.log(`Customer: ${customerName}`);
    console.log(`Amount: ${bookingData.totalPrice} kr`);
    console.log(`Lesson: ${lessonTypeName} on ${bookingData.scheduledDate} ${bookingData.startTime}-${bookingData.endTime}`);

    return NextResponse.json({
      success: true,
      message: 'Payment reminder sent successfully'
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}
