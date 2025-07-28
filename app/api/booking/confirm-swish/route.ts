import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { createGuestUser } from '../create/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get booking details
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'on_hold') {
      return NextResponse.json({ error: 'Booking is no longer available' }, { status: 400 });
    }

    // Update booking to pending payment status
    await db
      .update(bookings)
      .set({
        paymentStatus: 'pending',
        paymentMethod: 'swish',
        status: 'booked',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    // If guest booking, create user account
    let user = null;
    if (booking.isGuestBooking && booking.guestEmail && booking.guestName && booking.guestPhone) {
      try {
        user = await createGuestUser(booking.guestEmail, booking.guestName, booking.guestPhone);
        
        // Update booking with user ID
        await db
          .update(bookings)
          .set({
            userId: user.id,
            isGuestBooking: false,
          })
          .where(eq(bookings.id, bookingId));
      } catch (error) {
        console.error('Failed to create user account:', error);
      }
    }

    // Send email to admin with payment confirmation link
    await sendAdminNotification(booking);

    return NextResponse.json({ 
      success: true,
      message: 'Bokning bekräftad. Admin kommer att verifiera betalningen.',
      userId: user?.id 
    });
  } catch (error) {
    console.error('Error confirming Swish payment:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}

async function sendAdminNotification(booking: any) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/booking/admin-confirm?bookingId=${booking.id}&action=confirm`;
  const rejectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/booking/admin-confirm?bookingId=${booking.id}&action=reject`;

  const customerInfo = booking.isGuestBooking 
    ? `${booking.guestName} (${booking.guestEmail}, ${booking.guestPhone})`
    : `User ID: ${booking.userId}`;

  await transporter.sendMail({
    from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
    to: process.env.ADMIN_EMAIL || 'admin@dintrafikskolahlm.se',
    subject: 'Ny Swish-betalning att bekräfta',
    html: `
      <h1>Ny bokning med Swish-betalning</h1>
      <p>En ny bokning har gjorts med Swish som behöver bekräftas:</p>
      <ul>
        <li><strong>Boknings-ID:</strong> ${booking.id}</li>
        <li><strong>Datum:</strong> ${booking.scheduledDate}</li>
        <li><strong>Tid:</strong> ${booking.startTime} - ${booking.endTime}</li>
        <li><strong>Pris:</strong> ${booking.totalPrice} kr</li>
        <li><strong>Kund:</strong> ${customerInfo}</li>
      </ul>
      <p>Kontrollera Swish-appen för att verifiera betalningen.</p>
      <div style="margin-top: 20px;">
        <a href="${confirmUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Bekräfta betalning</a>
        <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Avvisa betalning</a>
      </div>
    `,
  });
}
