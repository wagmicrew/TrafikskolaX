import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, packagePurchases, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';
import { sendEmail } from '@/lib/mailer/universal-mailer';

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

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, packagePurchases, userCredits, packageContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cache } from '@/lib/redis/client';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const body = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stored = await cache.get(`qliro:push:${token}`);
    if (!stored) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { OrderId, MerchantReference, Status, NotificationType, PaymentTransactionId } = body || {};

    if (!OrderId || !MerchantReference || !Status) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    // Idempotent handling; allow duplicates as per docs
    if (MerchantReference.startsWith('booking_')) {
      const bookingId = MerchantReference.replace('booking_', '');
      if (Status === 'Completed') {
        await db.update(bookings)
          .set({ paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date() })
          .where(eq(bookings.id, bookingId));
      } else if (Status === 'OnHold') {
        await db.update(bookings)
          .set({ paymentStatus: 'pending', status: 'confirmed', updatedAt: new Date() })
          .where(eq(bookings.id, bookingId));
      }
    } else if (MerchantReference.startsWith('package_')) {
      const purchaseId = MerchantReference.replace('package_', '');
      if (Status === 'Completed') {
        // Mark package paid and issue credits
        const [purchase] = await db.select().from(packagePurchases).where(eq(packagePurchases.id, purchaseId)).limit(1);
        if (purchase) {
          await db.update(packagePurchases)
            .set({ paymentStatus: 'paid', paidAt: new Date(), paymentReference: String(OrderId) })
            .where(eq(packagePurchases.id, purchaseId));

          const contents = await db.select().from(packageContents).where(eq(packageContents.packageId, purchase.packageId));
          for (const content of contents) {
            const isHandledar = content.contentType === 'handledar' || !content.lessonTypeId;
            const existing = await db.select().from(userCredits)
              .where(and(eq(userCredits.userId, purchase.userId), isHandledar ? eq(userCredits.creditType, 'handledar') : eq(userCredits.lessonTypeId, content.lessonTypeId!)))
              .limit(1);
            if (existing.length) {
              await db.update(userCredits)
                .set({ creditsRemaining: (existing[0].creditsRemaining || 0) + (content.credits || 0), creditsTotal: (existing[0].creditsTotal || 0) + (content.credits || 0), updatedAt: new Date() })
                .where(eq(userCredits.id, existing[0].id));
            } else {
              await db.insert(userCredits).values({
                userId: purchase.userId,
                lessonTypeId: isHandledar ? null : content.lessonTypeId,
                handledarSessionId: null,
                creditsRemaining: content.credits || 0,
                creditsTotal: content.credits || 0,
                packageId: purchase.packageId,
                creditType: isHandledar ? 'handledar' : 'lesson'
              });
            }
          }
        }
      } else if (Status === 'OnHold') {
        await db.update(packagePurchases)
          .set({ paymentStatus: 'pending' })
          .where(eq(packagePurchases.id, purchaseId));
      }
    }

    return NextResponse.json({ CallbackResponse: 'received' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  // Allow preflight checks
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}



