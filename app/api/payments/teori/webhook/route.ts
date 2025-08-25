import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { teoriBookings, teoriSupervisors, users, qliroOrders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEmail } from '@/lib/mailer/universal-mailer'
import { teoriService } from '@/lib/payment/teori-service'
import { logger } from '@/lib/logging/logger'

export const runtime = 'nodejs'

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Teori-Signature') || request.headers.get('teori-signature');
    const url = new URL(request.url);
    // Accept both the new short param `t` and a legacy `token` param
    const token = url.searchParams.get('t') || url.searchParams.get('token') || '';
    const body = await request.text();
    
    logger.info('payment', 'Received Teori webhook', {
      hasSignature: !!signature,
      hasToken: !!token,
      bodyLength: body.length
    });
    
    // Verify the webhook signature using teoriService (guard against internal errors)
    let isValid = false;
    try {
      isValid = await teoriService.verifyWebhookSignature(signature || '', body);
    } catch (err) {
      logger.warn('payment', 'Error verifying Teori webhook signature', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!isValid) {
      logger.warn('payment', 'Invalid Teori webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const orderId: string = event.OrderId || '';
    const merchantReference: string = event.MerchantReference || '';
    const status: string = event.Status || '';

    logger.info('payment', 'Processing Teori webhook event', {
      orderId,
      merchantReference,
      status,
      eventType: event.EventType || 'unknown'
    });

    if (!status) {
      logger.error('payment', 'Invalid Teori webhook data', { orderId, merchantReference, status });
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // Resolve local order record to validate callback token (defense-in-depth)
    const mask = (v: string) => (v ? `${v.slice(0, 4)}...${v.slice(-4)}` : '');

    // Try to find order record by qliroOrderId and/or merchantReference
    let orderRecord: any | null = null;
    try {
      if (orderId || merchantReference) {
        const cond = merchantReference
          ? or(eq(qliroOrders.qliroOrderId, orderId), eq(qliroOrders.merchantReference, merchantReference))
          : eq(qliroOrders.qliroOrderId, orderId);
        const rows = await db.select().from(qliroOrders).where(cond).limit(1);
        orderRecord = rows[0] || null;
      }
    } catch (e) {
      logger.warn('payment', 'Failed to lookup qliro_orders for token validation', {
        error: e instanceof Error ? e.message : String(e),
        orderId,
        merchantReference
      });
    }

    // Token validation strategy (same as Qliro)
    if (orderRecord && orderRecord.callbackToken) {
      if (!token) {
        logger.warn('payment', 'Missing callback token on webhook for tokenized order', {
          orderId,
          merchantReference
        });
        return NextResponse.json({ error: 'Missing token' }, { status: 401 });
      }
      if (token !== orderRecord.callbackToken) {
        logger.warn('payment', 'Invalid callback token on webhook', {
          orderId,
          merchantReference,
          tokenMasked: mask(token),
        });
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      if (orderRecord.callbackTokenExpiresAt && new Date(orderRecord.callbackTokenExpiresAt) < new Date()) {
        logger.warn('payment', 'Expired callback token on webhook', {
          orderId,
          merchantReference,
          tokenMasked: mask(token)
        });
        return NextResponse.json({ error: 'Expired token' }, { status: 401 });
      }
    }

    // Only process paid orders
    if (status !== 'Paid') {
      logger.debug('payment', 'Teori webhook - ignoring non-paid status', { status, orderId, merchantReference });
      return NextResponse.json({ received: true });
    }

    // Determine our local reference (prefer MerchantReference; fallback to looked-up orderRecord)
    const localRef = merchantReference || orderRecord?.merchantReference || '';

    // Guard: require a reference we understand
    if (!localRef) {
      logger.warn('payment', 'Missing MerchantReference; cannot resolve local entity', { orderId });
      return NextResponse.json({ received: true });
    }

    // Check if this is a teori booking reference
    if (localRef.startsWith('teori_')) {
      const teoriBookingId = localRef.replace('teori_', '');

      // Guard: invalid UUIDs should be ignored gracefully
      if (!isUuid(teoriBookingId)) {
        logger.debug('payment', 'Teori webhook - non-uuid teori booking id, ignoring', { orderId, merchantReference, teoriBookingId });
        return NextResponse.json({ received: true });
      }

      // Get the teori booking record
      const booking = await db
        .select()
        .from(teoriBookings)
        .where(and(
          eq(teoriBookings.id, teoriBookingId),
          eq(teoriBookings.paymentStatus, 'pending')
        ))
        .limit(1);

      if (!booking.length) {
        return NextResponse.json({ received: true });
      }

      // Update teori booking payment status
      await db
        .update(teoriBookings)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(teoriBookings.id, teoriBookingId));

      // Send confirmation email for teori booking
      try {
        let userEmail: string | null = null;
        if (booking[0].studentId) {
          const u = await db.select().from(users).where(eq(users.id, booking[0].studentId)).limit(1);
          userEmail = u.at(0)?.email ?? null;
        }
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: 'Bekräftelse på betalning - Teorilektion',
            html: `
              <h1>Din teorilektion är bekräftad!</h1>
              <p>Din betalning för teorilektionen har mottagits.</p>
              <p>Du kan nu se bokningsdetaljer i din dashboard.</p>
            `,
            messageType: 'payment_confirmation',
          });
        }
      } catch (error) {
        console.error('Error sending teori booking confirmation email:', error);
      }

    } else {
      // Unknown reference format; acknowledge without changes
      logger.debug('payment', 'Teori webhook - unrecognized reference format', { orderId, merchantReference });
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Teori webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
