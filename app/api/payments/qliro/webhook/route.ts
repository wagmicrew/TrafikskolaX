import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, userCredits, packageContents, bookings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer/universal-mailer';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Qliro-Signature');
    const body = await request.text();
    
    logger.info('payment', 'Received Qliro webhook', {
      hasSignature: !!signature,
      bodyLength: body.length
    });
    
    // Verify the webhook signature using qliroService
    const isValid = await qliroService.verifyWebhookSignature(signature || '', body);

    if (!isValid) {
      logger.warn('payment', 'Invalid Qliro webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const orderId = event.OrderId;
    const status = event.Status;

    logger.info('payment', 'Processing Qliro webhook event', {
      orderId,
      status,
      eventType: event.EventType || 'unknown'
    });

    if (!orderId || !status) {
      logger.error('payment', 'Invalid Qliro webhook data', { orderId, status });
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // Only process paid orders
    if (status !== 'Paid') {
      logger.debug('payment', 'Qliro webhook - ignoring non-paid status', { status, orderId });
      return NextResponse.json({ received: true });
    }

    // Check if this is a booking reference
    if (orderId.startsWith('booking_')) {
      const bookingId = orderId.replace('booking_', '');

      // Get the booking record
      const booking = await db
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.id, bookingId),
          eq(bookings.paymentStatus, 'unpaid')
        ))
        .limit(1);

      if (!booking.length) {
        return NextResponse.json({ received: true });
      }

      // Update booking payment status
      await db
        .update(bookings)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      // Send confirmation email for booking
      try {
        const userEmail = booking[0].guestEmail || (await db.select().from(users).where(eq(users.id, booking[0].userId)))[0]?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: 'Bekräftelse på betalning',
            html: `
              <h1>Din bokning är bekräftad!</h1>
              <p>Din betalning för bokningen har mottagits.</p>
              <p>Du kan nu se bokningsdetaljer i din dashboard.</p>
            `,
            messageType: 'payment_confirmation',
          });
        }
      } catch (error) {
        console.error('Error sending booking confirmation email:', error);
      }

    } else { // Handle package purchase
      // Get the purchase record
      const purchase = await db
        .select()
        .from(packagePurchases)
        .where(and(
          eq(packagePurchases.id, orderId),
          eq(packagePurchases.paymentStatus, 'pending')
        ))
        .limit(1);

      if (!purchase.length) {
        return NextResponse.json({ received: true });
      }

      // Update payment status
      await db
        .update(packagePurchases)
        .set({
          paymentStatus: 'paid',
          paidAt: new Date(),
          paymentReference: event.PaymentReference
        })
        .where(eq(packagePurchases.id, orderId));

      // Get package contents
      const contents = await db
        .select()
        .from(packageContents)
        .where(eq(packageContents.packageId, purchase[0].packageId));

      // Add credits to user
      for (const content of contents) {
        if (content.lessonTypeId && content.credits) {
          await db
            .insert(userCredits)
            .values({
              userId: purchase[0].userId,
              lessonTypeId: content.lessonTypeId,
              credits: content.credits,
              source: 'package_purchase',
              sourceId: orderId
            });
        }
      }

      // Send confirmation email to user
      try {
        await sendEmail({
          to: purchase[0].userEmail,
          subject: 'Bekräftelse på betalning',
          html: `
            <h1>Tack för ditt köp!</h1>
            <p>Din betalning har mottagits och dina krediter har aktiverats.</p>
            <p>Köp-ID: ${orderId}</p>
            <p>Betalningsreferens: ${event.PaymentReference || 'Ej tillgänglig'}</p>
            <p>Du kan nu boka dina lektioner i din dashboard.</p>
          `,
          messageType: 'payment_confirmation',
        });
      } catch(error) {
        console.error('Error sending confirmation email:', error);
      }

      // Notify admin
      try {
        await sendEmail({
          to: 'admin@trafikskolax.se',
          subject: 'Ny betalning mottagen',
          html: `
            <h1>Ny betalning mottagen</h1>
            <p>En betalning har genomförts via Qliro.</p>
            <p>Kund: ${purchase[0].userEmail}</p>
            <p>Köp-ID: ${orderId}</p>
            <p>Belopp: ${purchase[0].pricePaid} kr</p>
            <p>Betalningsreferens: ${event.PaymentReference || 'Ej tillgänglig'}</p>
          `,
          messageType: 'payment_confirmation',
        });
      } catch(error) {
        console.error('Error notifying admin:', error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Qliro webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
