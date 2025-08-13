import { NextRequest, NextResponse } from 'next/server';
import { qliroService } from '@/lib/payment/qliro-service';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, reference, description, returnUrl } = body as { amount: number | string; reference: string; description: string; returnUrl: string };
    let { customerEmail, customerPhone, customerFirstName, customerLastName } = body as { customerEmail?: string; customerPhone?: string; customerFirstName?: string; customerLastName?: string };

    // Validate required fields
    if (!amount || !reference || !description || !returnUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // Create checkout session
    const checkoutResult = await qliroService.createCheckout({
      amount,
      reference,
      description,
      returnUrl,
      customerEmail,
      customerPhone,
      customerFirstName,
      customerLastName,
    });

    logger.info('payment', 'Qliro checkout session created successfully', {
      checkoutId: checkoutResult.checkoutId,
      reference
    });

    return NextResponse.json({
      success: true,
      checkoutId: checkoutResult.checkoutId,
      checkoutUrl: checkoutResult.checkoutUrl,
      merchantReference: checkoutResult.merchantReference,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('payment', 'Failed to create Qliro checkout session', {
      error: errorMessage
    });

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
