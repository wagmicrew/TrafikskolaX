import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { teoriService } from '@/lib/payment/teori-service';
import { db } from '@/lib/db';
import { teoriBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Debug: Log full request body
    console.log('[Teori Debug] Create checkout request body:', JSON.stringify(body, null, 2));
    
    let { amount, reference, description, returnUrl } = body as { amount: number | string; reference: string; description: string; returnUrl: string };
    let { customerEmail, customerPhone, customerFirstName, customerLastName } = body as { customerEmail?: string; customerPhone?: string; customerFirstName?: string; customerLastName?: string };

    // Validate required fields
    if (!amount || !reference || !description || !returnUrl) {
      console.log('[Teori Debug] Validation failed - missing fields:', { amount: !!amount, reference: !!reference, description: !!description, returnUrl: !!returnUrl });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure a unique merchant reference for test flows to avoid ORDER_ALREADY_EXISTS
    try {
      const needsUnique = typeof reference === 'string' && /^test_admin_ui/i.test(reference);
      if (needsUnique) {
        const suffix = Date.now().toString(36).slice(-8); // compact time
        const base = reference.replace(/[^A-Za-z0-9_-]/g, '').slice(0, Math.max(1, 25 - 1 - suffix.length));
        reference = `${base}_${suffix}`;
        console.log('[Teori Debug] Adjusted unique reference:', reference);
      }
    } catch {}

    logger.info('payment', 'Creating Teori checkout session', {
      reference,
      amount,
      description
    });

    // Check if Teori is enabled
    const isEnabled = await teoriService.isEnabled();
    if (!isEnabled) {
      logger.warn('payment', 'Teori checkout requested but service is disabled');
      return NextResponse.json({ error: 'Teori payment is not available' }, { status: 503 });
    }

    // Enrich customer information from database if not provided
    try {
      if (!customerEmail || !customerFirstName || !customerLastName || !customerPhone) {
        if (typeof reference === 'string') {
          if (reference.startsWith('teori_')) {
            const id = reference.replace('teori_', '');
            const rows = await db
              .select({ id: teoriBookings.id, studentId: teoriBookings.studentId })
              .from(teoriBookings)
              .where(eq(teoriBookings.id, id))
              .limit(1);
            const booking = rows[0] as { id: string; studentId: string } | undefined;
            if (booking?.studentId) {
              const u = await db.select().from(users).where(eq(users.id, booking.studentId)).limit(1);
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

    // Extract teori booking ID from reference for order tracking
    let teoriBookingId: string | undefined;

    if (typeof reference === 'string') {
      if (reference.startsWith('teori_')) {
        teoriBookingId = reference.replace('teori_', '');
      }
    }

    // Create checkout session with order tracking
    const checkoutParams = {
      amount: typeof amount === 'number' ? amount : Number(amount),
      reference,
      description,
      returnUrl,
      teoriBookingId,
      customerEmail,
      customerPhone,
      customerFirstName,
      customerLastName,
    };
    
    console.log('[Teori Debug] Calling teoriService.getOrCreateCheckout with params:', JSON.stringify(checkoutParams, null, 2));
    
    // Use the new order tracking method
    try {
      const checkoutResult = await teoriService.getOrCreateCheckout(checkoutParams);

      logger.info('payment', `Teori checkout session ${checkoutResult.isExisting ? 'reused' : 'created'} successfully`, {
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

    logger.error('payment', 'Failed to create Teori checkout session', {
      error: errorMessage,
      status: anyErr?.status,
      statusText: anyErr?.statusText,
      body: anyErr?.body
    });

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: errorMessage,
        teori: {
          status: anyErr?.status,
          statusText: anyErr?.statusText,
          body: anyErr?.body
        }
      },
      { status }
    );
  }
}
