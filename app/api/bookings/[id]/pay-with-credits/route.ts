import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, userCredits, internalMessages } from '@/lib/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import sgMail from '@sendgrid/mail';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

// Helper function to get SendGrid API key from database
async function getSendGridApiKey(): Promise<string> {
  try {
    const siteSettings = await db.query.siteSettings.findFirst({
      where: (settings, { eq }) => eq(settings.key, 'sendgrid_api_key'),
    });
    
    if (siteSettings?.value) {
      return siteSettings.value;
    }
    
    // Fallback to environment variable if not in database
    return process.env.SENDGRID_API_KEY || '';
  } catch (error) {
    console.error('Error fetching SendGrid API key from database:', error);
    // Fallback to environment variable on error
    return process.env.SENDGRID_API_KEY || '';
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const body = await request.json();
    const { userId, lessonTypeId } = body;

    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let tokenUserId;
    try {
      const payload = await verifyToken(token.value);
      if (!payload || !(payload as any).userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      tokenUserId = (payload as any).userId;
      console.log('Token payload:', payload);
      console.log('Request userId:', userId);
      console.log('Token userId:', tokenUserId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the booking - use tokenUserId to verify ownership
    const booking = await db.query.bookings.findFirst({
      where: (bookings, { eq, and, isNull }) => 
        and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, tokenUserId),
          isNull(bookings.deletedAt)
        ),
      with: {
        lessonType: true,
        user: true,
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
    }

    // Check for available credits - use tokenUserId
    const userCreditRecords = await db.query.userCredits.findMany({
      where: (credits, { eq, and, or, isNull }) => 
        and(
          eq(credits.userId, tokenUserId),
          or(
            eq(credits.lessonTypeId, booking.lessonTypeId),
            and(
              isNull(credits.lessonTypeId),
              eq(credits.creditType, 'handledar')
            )
          )
        )
    });

    const totalUserCredits = userCreditRecords ? userCreditRecords.reduce((sum, credit) => sum + credit.creditsRemaining, 0) : 0;

    if (totalUserCredits < 1) {
      return NextResponse.json({ error: 'Not enough credits available' }, { status: 400 });
    }

    // Process credit payment without transaction
    // Deduct 1 credit from the first available credit record
    const firstCreditRecord = userCreditRecords.find(record => record.creditsRemaining > 0);
    if (firstCreditRecord) {
      await db
        .update(userCredits)
        .set({
          creditsRemaining: firstCreditRecord.creditsRemaining - 1,
          updatedAt: new Date()
        })
        .where(eq(userCredits.id, firstCreditRecord.id));
    }

    // Update booking status
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'credits',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId));

    // Send confirmation email and internal message
    await sendPaymentConfirmationNotification(booking);

    return NextResponse.json({ 
      success: true,
      message: 'Payment processed successfully with credits'
    });

  } catch (error) {
    console.error('Error processing credit payment:', error);
    return NextResponse.json({ error: 'Failed to process credit payment' }, { status: 500 });
  }
}

async function sendPaymentConfirmationNotification(booking: any) {
  try {
    // Save internal message
    const formattedDate = format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
    const bookingUrl = `${baseUrl}/dashboard/student/bokningar/${booking.id}`;
    
    await db.insert(internalMessages).values({
      fromUserId: booking.userId,
      toUserId: booking.userId, // User sends message to themselves
      subject: '✅ Din betalning med krediter är bekräftad!',
      message: `Din körlektion ${formattedDate} kl ${booking.startTime} har betalats med krediter och är bekräftad.

Se din bokning här: ${bookingUrl}

Vi ser fram emot att träffa dig!`,
      messageType: 'booking',
      isRead: false,
    });

    // Send email confirmation
    const apiKey = await getSendGridApiKey();
    if (!apiKey) {
      console.error('SendGrid API key not found');
      return;
    }
    sgMail.setApiKey(apiKey);

    await sgMail.send({
      from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
      to: booking.user.email,
      subject: '✅ Betalning med krediter bekräftad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #16a34a; text-align: center; margin-bottom: 30px;">🎉 Din betalning är bekräftad!</h1>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #0369a1; margin-top: 0;">Bokningsdetaljer</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Datum:</td><td style="padding: 8px 0;">${formattedDate}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Tid:</td><td style="padding: 8px 0;">${booking.startTime}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Varaktighet:</td><td style="padding: 8px 0;">${booking.durationMinutes} minuter</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Växellåda:</td><td style="padding: 8px 0;">${booking.transmissionType === 'manual' ? 'Manuell' : 'Automat'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Betalningsmetod:</td><td style="padding: 8px 0; color: #16a34a; font-weight: bold;">Krediter</td></tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" 
                 style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                📚 Visa min bokning
              </a>
            </div>
            
            <p style="color: #6b7280; text-align: center; margin-top: 30px;">Vi ser fram emot att träffa dig!</p>
            <p style="color: #6b7280; text-align: center;">Med vänliga hälsningar,<br><strong>Din Trafikskola HLM</strong></p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment confirmation notification:', error);
  }
}
