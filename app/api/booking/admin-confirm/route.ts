import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('bookingId');
    const action = searchParams.get('action');

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (action !== 'confirm' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get booking details
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update booking based on action
    if (action === 'confirm') {
      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      // Send confirmation email to customer
      await sendCustomerConfirmation(booking, true);

      return new NextResponse(`
        <html>
          <head>
            <title>Betalning bekräftad</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
              .container { text-align: center; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { color: #4CAF50; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✓</div>
              <h1>Betalning bekräftad</h1>
              <p>Bokningen har bekräftats och kunden har fått en bekräftelse via e-post.</p>
              <p>Du kan stänga detta fönster.</p>
            </div>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    } else {
      // Reject - set back to on_hold or cancel
      await db
        .update(bookings)
        .set({
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      // Send rejection email to customer
      await sendCustomerConfirmation(booking, false);

      return new NextResponse(`
        <html>
          <head>
            <title>Betalning avvisad</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
              .container { text-align: center; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .error { color: #f44336; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">✗</div>
              <h1>Betalning avvisad</h1>
              <p>Bokningen har avvisats och kunden har fått information via e-post.</p>
              <p>Du kan stänga detta fönster.</p>
            </div>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }
  } catch (error) {
    console.error('Error processing admin confirmation:', error);
    return NextResponse.json({ error: 'Failed to process confirmation' }, { status: 500 });
  }
}

async function sendCustomerConfirmation(booking: any, isConfirmed: boolean) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const customerEmail = booking.guestEmail || await getCustomerEmail(booking.userId);
  const customerName = booking.guestName || await getCustomerName(booking.userId);

  if (!customerEmail) return;

  const subject = isConfirmed 
    ? 'Din bokning är bekräftad' 
    : 'Din bokning kunde inte bekräftas';

  const html = isConfirmed 
    ? `
      <h1>Din bokning är bekräftad!</h1>
      <p>Hej ${customerName},</p>
      <p>Din betalning har verifierats och din körlektion är nu bokad.</p>
      <h3>Bokningsdetaljer:</h3>
      <ul>
        <li><strong>Datum:</strong> ${booking.scheduledDate}</li>
        <li><strong>Tid:</strong> ${booking.startTime} - ${booking.endTime}</li>
        <li><strong>Pris:</strong> ${booking.totalPrice} kr</li>
      </ul>
      <p>Vi ser fram emot att träffa dig!</p>
      <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
    `
    : `
      <h1>Din bokning kunde inte bekräftas</h1>
      <p>Hej ${customerName},</p>
      <p>Vi kunde tyvärr inte verifiera din betalning för bokningen.</p>
      <p>Om du har gjort en betalning, vänligen kontakta oss så hjälper vi dig.</p>
      <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
    `;

  await transporter.sendMail({
    from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
    to: customerEmail,
    subject,
    html,
  });
}

async function getCustomerEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user?.email || null;
}

async function getCustomerName(userId: string | null): Promise<string> {
  if (!userId) return 'Kund';
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ? `${user.firstName} ${user.lastName}` : 'Kund';
}
