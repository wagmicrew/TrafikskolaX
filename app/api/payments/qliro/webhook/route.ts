import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, userCredits, packageContents, bookings, users, qliroOrders, handledarBookings } from '@/lib/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer/universal-mailer';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Qliro-Signature') || request.headers.get('qliro-signature');
    const url = new URL(request.url);
    // Accept both the new short param `t` and a legacy `token` param
    const token = url.searchParams.get('t') || url.searchParams.get('token') || '';
    const body = await request.text();
    
    logger.info('payment', 'Received Qliro webhook', {
      hasSignature: !!signature,
      hasToken: !!token,
      bodyLength: body.length
    });
    
    // Verify the webhook signature using qliroService (guard against internal errors)
    let isValid = false;
    try {
      isValid = await qliroService.verifyWebhookSignature(signature || '', body);
    } catch (err) {
      logger.warn('payment', 'Error verifying Qliro webhook signature', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!isValid) {
      logger.warn('payment', 'Invalid Qliro webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const orderId: string = event.OrderId || '';
    const merchantReference: string = event.MerchantReference || '';
    const status: string = event.Status || '';

    logger.info('payment', 'Processing Qliro webhook event', {
      orderId,
      merchantReference,
      status,
      eventType: event.EventType || 'unknown'
    });

    if (!status) {
      logger.error('payment', 'Invalid Qliro webhook data', { orderId, merchantReference, status });
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

    // Token validation strategy:
    // - If the matched record has a callback token, require it and verify match + expiry
    // - If no record match: if token present, try resolve by token and ensure identifiers match; else reject
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
    } else if (!orderRecord) {
      if (token) {
        // Attempt to resolve by token and ensure identifiers match
        try {
          const rows = await db.select().from(qliroOrders).where(eq(qliroOrders.callbackToken, token)).limit(1);
          const rec = rows[0];
          if (!rec) {
            logger.warn('payment', 'Unknown callback token on webhook', { tokenMasked: mask(token) });
            return NextResponse.json({ error: 'Unknown token' }, { status: 401 });
          }

          // If identifiers are present, ensure they match the record
          if ((orderId && rec.qliroOrderId && rec.qliroOrderId !== orderId) || (merchantReference && rec.merchantReference && rec.merchantReference !== merchantReference)) {
            logger.warn('payment', 'Token/order mismatch on webhook', {
              tokenMasked: mask(token),
              orderId,
              merchantReference
            });
            return NextResponse.json({ error: 'Token/order mismatch' }, { status: 401 });
          }

          if (rec.callbackTokenExpiresAt && new Date(rec.callbackTokenExpiresAt) < new Date()) {
            logger.warn('payment', 'Expired callback token (resolved by token) on webhook', {
              tokenMasked: mask(token)
            });
            return NextResponse.json({ error: 'Expired token' }, { status: 401 });
          }

          // Bind resolved record if useful later (e.g., for logging)
          orderRecord = rec;
        } catch (e) {
          logger.warn('payment', 'Error resolving webhook by token', { error: e instanceof Error ? e.message : String(e) });
          return NextResponse.json({ error: 'Token resolution failed' }, { status: 401 });
        }
      } else {
        logger.warn('payment', 'Rejecting webhook: no order record and no token provided', { orderId, merchantReference });
        return NextResponse.json({ error: 'Missing token' }, { status: 401 });
      }
    } else {
      // orderRecord exists but has no token -> allow (legacy order) but log
      logger.debug('payment', 'Order record without callback token; proceeding based on signature only', {
        orderId,
        merchantReference
      });
    }

    // Only process paid orders
    if (status !== 'Paid') {
      logger.debug('payment', 'Qliro webhook - ignoring non-paid status', { status, orderId, merchantReference });
      return NextResponse.json({ received: true });
    }

    // Determine our local reference (prefer MerchantReference; fallback to looked-up orderRecord)
    const localRef = merchantReference || orderRecord?.merchantReference || '';

    // Guard: require a reference we understand
    if (!localRef) {
      logger.warn('payment', 'Missing MerchantReference; cannot resolve local entity', { orderId });
      return NextResponse.json({ received: true });
    }

    // Check if this is a booking reference
    if (localRef.startsWith('booking_')) {
      const bookingId = localRef.replace('booking_', '');

      // Guard: invalid UUIDs should be ignored gracefully
      if (!isUuid(bookingId)) {
        logger.debug('payment', 'Qliro webhook - non-uuid booking id, ignoring', { orderId, merchantReference, bookingId });
        return NextResponse.json({ received: true });
      }

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
        let userEmail: string | null = booking[0].guestEmail as string | null;
        if (!userEmail && booking[0].userId) {
          const u = await db.select().from(users).where(eq(users.id, booking[0].userId)).limit(1);
          userEmail = u.at(0)?.email ?? null;
        }
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

    } else if (localRef.startsWith('handledar_')) {
      const handledarId = localRef.replace('handledar_', '');

      // Guard: invalid UUIDs should be ignored gracefully
      if (!isUuid(handledarId)) {
        logger.debug('payment', 'Qliro webhook - non-uuid handledar id, ignoring', { orderId, merchantReference, handledarId });
        return NextResponse.json({ received: true });
      }

      // Get the handledar booking record
      const hb = await db
        .select()
        .from(handledarBookings)
        .where(and(
          eq(handledarBookings.id, handledarId),
          eq(handledarBookings.paymentStatus, 'pending')
        ))
        .limit(1);

      if (!hb.length) {
        return NextResponse.json({ received: true });
      }

      // Update handledar booking payment status
      await db
        .update(handledarBookings)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(handledarBookings.id, handledarId));

      // Send confirmation email for handledar booking
      try {
        const emailTo = hb[0].supervisorEmail || (hb[0].studentId ? (await db.select().from(users).where(eq(users.id, hb[0].studentId))).at(0)?.email : null);
        if (emailTo) {
          await sendEmail({
            to: emailTo,
            subject: 'Bekräftelse på betalning',
            html: `
              <h1>Din bokning till Handledarutbildning är bekräftad!</h1>
              <p>Din betalning har mottagits.</p>
              <p>Mer information skickas via e-post.</p>
            `,
            messageType: 'payment_confirmation',
          });
        }
      } catch (error) {
        console.error('Error sending handledar confirmation email:', error);
      }

    } else if (localRef.startsWith('package_') || localRef.startsWith('order_')) { // Handle package purchase
      const purchaseId = localRef.replace(/^package_/, '').replace(/^order_/, '');
      // Guard: invalid UUIDs should be ignored gracefully
      if (!isUuid(purchaseId)) {
        logger.debug('payment', 'Qliro webhook - non-uuid purchase id, ignoring', { orderId, merchantReference, purchaseId });
        return NextResponse.json({ received: true });
      }
      // Get the purchase record
      const purchase = await db
        .select()
        .from(packagePurchases)
        .where(and(
          eq(packagePurchases.id, purchaseId),
          eq(packagePurchases.paymentStatus, 'pending')
        ))
        .limit(1);

      if (!purchase.length) {
        return NextResponse.json({ received: true });
      }

      // Detect if optional column paid_at exists to avoid runtime errors on legacy DBs
      let paidAtExists = false;
      try {
        const result = await db.execute(sql`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'package_purchases' AND column_name = 'paid_at' LIMIT 1`) as unknown;
        const rows = Array.isArray(result) ? (result as unknown[]) : ((result as { rows?: unknown[] } | undefined)?.rows ?? []);
        paidAtExists = rows.length > 0;
      } catch {
        paidAtExists = false;
      }

      // Update payment status (conditionally include paidAt)
      const updateValues: Record<string, unknown> = {
        paymentStatus: 'paid',
        paymentReference: event.PaymentReference,
      };
      if (paidAtExists) {
        updateValues.paidAt = new Date();
      }

      await db
        .update(packagePurchases)
        .set(updateValues)
        .where(eq(packagePurchases.id, purchaseId));

      // Get package contents we need to convert into credits
      const contents = await db
        .select({
          lessonTypeId: packageContents.lessonTypeId,
          handledarSessionId: packageContents.handledarSessionId,
          credits: packageContents.credits,
          contentType: packageContents.contentType,
        })
        .from(packageContents)
        .where(eq(packageContents.packageId, purchase[0].packageId));

      // Add credits to user according to correct schema (lesson and handledar)
      for (const content of contents) {
        const qty = Number(content.credits || 0);
        if (!qty || qty <= 0) continue;

        // Lesson credits (by lessonType)
        if (content.lessonTypeId) {
          const existing = await db
            .select()
            .from(userCredits)
            .where(and(
              eq(userCredits.userId, purchase[0].userId),
              eq(userCredits.lessonTypeId, content.lessonTypeId)
            ))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(userCredits)
              .set({
                creditsRemaining: existing[0].creditsRemaining + qty,
                creditsTotal: existing[0].creditsTotal + qty,
                updatedAt: new Date(),
              })
              .where(eq(userCredits.id, existing[0].id));
          } else {
            await db
              .insert(userCredits)
              .values({
                userId: purchase[0].userId,
                lessonTypeId: content.lessonTypeId,
                creditsRemaining: qty,
                creditsTotal: qty,
                packageId: purchase[0].packageId,
                creditType: 'lesson',
              });
          }
        } else if (content.contentType === 'handledar') {
          // Handledar credits (no lessonTypeId, creditType = 'handledar')
          const existingHandledar = await db
            .select()
            .from(userCredits)
            .where(and(
              eq(userCredits.userId, purchase[0].userId),
              sql`${userCredits.lessonTypeId} IS NULL`,
              eq(userCredits.creditType, 'handledar')
            ))
            .limit(1);

          if (existingHandledar.length > 0) {
            await db
              .update(userCredits)
              .set({
                creditsRemaining: existingHandledar[0].creditsRemaining + qty,
                creditsTotal: existingHandledar[0].creditsTotal + qty,
                updatedAt: new Date(),
              })
              .where(eq(userCredits.id, existingHandledar[0].id));
          } else {
            await db
              .insert(userCredits)
              .values({
                userId: purchase[0].userId,
                handledarSessionId: content.handledarSessionId || null,
                lessonTypeId: null,
                creditsRemaining: qty,
                creditsTotal: qty,
                packageId: purchase[0].packageId,
                creditType: 'handledar',
              });
          }
        }
      }

      // Send confirmation email to user
      try {
        const toEmail = purchase[0].userEmail;
        if (toEmail) {
          await sendEmail({
            to: toEmail,
            subject: 'Bekräftelse på betalning',
            html: `
              <h1>Tack för ditt köp!</h1>
              <p>Din betalning har mottagits och dina krediter har aktiverats.</p>
              <p>Köp-ID: ${purchaseId}</p>
              <p>Betalningsreferens: ${event.PaymentReference || 'Ej tillgänglig'}</p>
              <p>Du kan nu boka dina lektioner i din dashboard.</p>
            `,
            messageType: 'payment_confirmation',
          });
        }
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
            <p>Köp-ID: ${purchaseId}</p>
            <p>Belopp: ${purchase[0].pricePaid} kr</p>
            <p>Betalningsreferens: ${event.PaymentReference || 'Ej tillgänglig'}</p>
          `,
          messageType: 'payment_confirmation',
        });
      } catch(error) {
        console.error('Error notifying admin:', error);
      }
    } else {
      // Unknown reference format; acknowledge without changes
      logger.debug('payment', 'Qliro webhook - unrecognized reference format', { orderId, merchantReference });
      return NextResponse.json({ received: true });
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

