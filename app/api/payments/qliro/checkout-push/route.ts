import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, packagePurchases, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';
import { sendEmail } from '@/lib/mailer/universal-mailer';
import { cache } from '@/lib/redis/client';

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Qliro-Signature') || '';
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || '';
    const body = await request.text();

    logger.info('payment', 'Received Qliro checkout-push', {
      hasSignature: !!signature,
      hasToken: !!token,
      bodyLength: body.length
    });

    // Optional token check (best-effort)
    if (!token) {
      logger.warn('payment', 'Missing push token on checkout-push');
    }

    const isValid = await qliroService.verifyWebhookSignature(signature, body);
    if (!isValid) {
      logger.warn('payment', 'Invalid Qliro checkout-push signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const orderId: string = event.OrderId || event.MerchantReference || '';
    const status: string = event.Status || '';

    if (!orderId) {
      logger.error('payment', 'checkout-push missing order identifier');
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    // We only act on paid statuses here; others are acknowledgements
    if (status !== 'Paid') {
      logger.debug('payment', 'checkout-push non-paid status, acknowledged', { status, orderId });
      return NextResponse.json({ received: true });
    }

    // Persist merchantReference -> orderId mapping (TTL 3 hours) for future reuse
    try {
      const rawRef = String(event.MerchantReference || '').trim();
      const rawOrderId = String(event.OrderId || '').trim();
      if (rawRef && rawOrderId) {
        const sanitizedRef = rawRef.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 25) || rawRef.slice(0, 25);
        await cache.set(
          `qliro:ref:${sanitizedRef}`,
          { orderId: rawOrderId, createdAt: Date.now() },
          60 * 60 * 3
        );
        logger.debug('payment', 'Cached Qliro merchantReference mapping from checkout-push', {
          merchantReference: sanitizedRef,
          orderId: rawOrderId,
        });
      }
    } catch (e) {
      logger.warn('payment', 'Failed to cache Qliro merchantReference mapping on checkout-push', {
        error: e instanceof Error ? e.message : String(e)
      });
    }

    // booking_<id> pattern or package purchase id
    if (orderId.startsWith('booking_')) {
      const bookingId = orderId.replace('booking_', '');
      const rows = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, 'unpaid')))
        .limit(1);

      if (!rows.length) return NextResponse.json({ received: true });

      await db
        .update(bookings)
        .set({ paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));

      try {
        const userEmail = rows[0].guestEmail || (await db.select().from(users).where(eq(users.id, rows[0].userId))).at(0)?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: 'Bekräftelse på betalning',
            html: '<h1>Din bokning är bekräftad!</h1><p>Din betalning har mottagits.</p>',
            messageType: 'payment_confirmation',
          });
        }
      } catch {}
    } else {
      const rows = await db
        .select()
        .from(packagePurchases)
        .where(and(eq(packagePurchases.id, orderId), eq(packagePurchases.paymentStatus, 'pending')))
        .limit(1);
      if (!rows.length) return NextResponse.json({ received: true });

      await db
        .update(packagePurchases)
        .set({ paymentStatus: 'paid', updatedAt: new Date() })
        .where(eq(packagePurchases.id, orderId));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('payment', 'checkout-push handler error', { error: (error as Error).message });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
