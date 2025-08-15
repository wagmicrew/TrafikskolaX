import { NextRequest, NextResponse } from 'next/server';
import { qliroService } from '@/lib/payment/qliro-service';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';
import { cache } from '@/lib/redis/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Debug: Log full request body
    console.log('[Qliro Debug] Create checkout request body:', JSON.stringify(body, null, 2));
    
    let { amount, reference, description, returnUrl } = body as { amount: number | string; reference: string; description: string; returnUrl: string };
    let { customerEmail, customerPhone, customerFirstName, customerLastName } = body as { customerEmail?: string; customerPhone?: string; customerFirstName?: string; customerLastName?: string };

    // Validate required fields
    if (!amount || !reference || !description || !returnUrl) {
      console.log('[Qliro Debug] Validation failed - missing fields:', { amount: !!amount, reference: !!reference, description: !!description, returnUrl: !!returnUrl });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure a unique merchant reference for test flows to avoid ORDER_ALREADY_EXISTS
    try {
      const needsUnique = typeof reference === 'string' && /^test_admin_ui/i.test(reference);
      if (needsUnique) {
        const suffix = Date.now().toString(36).slice(-8); // compact time
        const base = reference.replace(/[^A-Za-z0-9_-]/g, '').slice(0, Math.max(1, 25 - 1 - suffix.length));
        reference = `${base}_${suffix}`;
        console.log('[Qliro Debug] Adjusted unique reference:', reference);
      }
    } catch {}

    logger.info('payment', 'Creating Qliro checkout session', {
      reference,
      amount,
      description
    });

    // Check if Qliro is enabled
    const isEnabled = await qliroService.isEnabled();
    if (!isEnabled) {
      logger.warn('payment', 'Qliro checkout requested but service is disabled');
      return NextResponse.json({ error: 'Qliro payment is not available' }, { status: 503 });
    }

    // Enrich customer information from database if not provided
    try {
      if (!customerEmail || !customerFirstName || !customerLastName || !customerPhone) {
        if (typeof reference === 'string') {
          if (reference.startsWith('booking_')) {
            const id = reference.replace('booking_', '');
            const rows = await db
              .select({ id: bookings.id, userId: bookings.userId })
              .from(bookings)
              .where(eq(bookings.id, id))
              .limit(1);
            const booking = rows[0] as { id: string; userId: string } | undefined;
            if (booking?.userId) {
              const u = await db.select().from(users).where(eq(users.id, booking.userId)).limit(1);
              if (u[0]) {
                customerEmail = customerEmail || u[0].email || undefined;
                customerPhone = customerPhone || (u[0].phone || '').toString();
                customerFirstName = customerFirstName || u[0].firstName || undefined;
                customerLastName = customerLastName || u[0].lastName || undefined;
              }
            }
          } else if (reference.startsWith('handledar_')) {
            const id = reference.replace('handledar_', '');
            const rows = await db
              .select({ id: handledarBookings.id, studentId: handledarBookings.studentId, supervisorEmail: handledarBookings.supervisorEmail, supervisorPhone: handledarBookings.supervisorPhone })
              .from(handledarBookings)
              .where(eq(handledarBookings.id, id))
              .limit(1);
            const hb = rows[0] as { studentId?: string; supervisorEmail?: string; supervisorPhone?: string } | undefined;
            if (hb?.studentId) {
              const u = await db.select().from(users).where(eq(users.id, hb.studentId)).limit(1);
              if (u[0]) {
                customerEmail = customerEmail || u[0].email || undefined;
                customerPhone = customerPhone || (u[0].phone || '').toString();
                customerFirstName = customerFirstName || u[0].firstName || undefined;
                customerLastName = customerLastName || u[0].lastName || undefined;
              }
            } else {
              customerEmail = customerEmail || hb?.supervisorEmail || undefined;
              customerPhone = customerPhone || (hb?.supervisorPhone || '').toString();
            }
          } else if (reference.startsWith('package_') || reference.startsWith('order_')) {
            const id = reference.replace(/^package_/, '').replace(/^order_/, '');
            const rows = await db
              .select({ id: packagePurchases.id, userId: packagePurchases.userId })
              .from(packagePurchases)
              .where(eq(packagePurchases.id, id))
              .limit(1);
            const p = rows[0] as { id: string; userId: string } | undefined;
            if (p?.userId) {
              const u = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
              if (u[0]) {
                customerEmail = customerEmail || u[0].email || undefined;
                customerPhone = customerPhone || (u[0].phone || '').toString();
                customerFirstName = customerFirstName || u[0].firstName || undefined;
                customerLastName = customerLastName || u[0].lastName || undefined;
              }
            }
          }
        }
      }
    } catch (_e) {
      // Non-fatal; continue without enrichment
    }

    // Extract booking/order IDs from reference for order tracking
    let bookingId: string | undefined;
    let handledarBookingId: string | undefined;
    let packagePurchaseId: string | undefined;

    if (typeof reference === 'string') {
      if (reference.startsWith('booking_')) {
        bookingId = reference.replace('booking_', '');
      } else if (reference.startsWith('handledar_')) {
        handledarBookingId = reference.replace('handledar_', '');
      } else if (reference.startsWith('package_') || reference.startsWith('order_')) {
        packagePurchaseId = reference.replace(/^package_/, '').replace(/^order_/, '');
      }
    }

    // Create checkout session with order tracking
    const checkoutParams = {
      amount: typeof amount === 'number' ? amount : Number(amount),
      reference,
      description,
      returnUrl,
      bookingId,
      handledarBookingId,
      packagePurchaseId,
    };
    
    console.log('[Qliro Debug] Calling qliroService.getOrCreateCheckout with params:', JSON.stringify(checkoutParams, null, 2));
    
    // Use the new order tracking method
    try {
      const checkoutResult = await qliroService.getOrCreateCheckout(checkoutParams);

      logger.info('payment', `Qliro checkout session ${checkoutResult.isExisting ? 'reused' : 'created'} successfully`, {
        checkoutId: checkoutResult.checkoutId,
        reference,
        isExisting: checkoutResult.isExisting
      });

      return NextResponse.json({
        success: true,
        checkoutId: checkoutResult.checkoutId,
        checkoutUrl: checkoutResult.checkoutUrl,
        merchantReference: checkoutResult.merchantReference,
        isExisting: checkoutResult.isExisting,
      });
    } catch (error) {
      // The new order tracking system handles all order management internally
      throw error;
    }

  } catch (error) {
    const anyErr = error as any;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = typeof anyErr?.status === 'number' ? anyErr.status : 500;

    logger.error('payment', 'Failed to create Qliro checkout session', {
      error: errorMessage,
      status: anyErr?.status,
      statusText: anyErr?.statusText,
      body: anyErr?.body
    });

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: errorMessage,
        qliro: {
          status: anyErr?.status,
          statusText: anyErr?.statusText,
          body: anyErr?.body
        }
      },
      { status }
    );
  }
}
