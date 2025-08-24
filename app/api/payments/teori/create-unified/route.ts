import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { teoriService } from '@/lib/payment/teori-service';
import { db } from '@/lib/db';
import { teoriBookings, teoriSessions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';

interface UnifiedTeoriPaymentRequest {
  type: 'teori';
  id: string;
  returnUrl?: string;
  amount?: number; // Optional override
  description?: string; // Optional override
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as UnifiedTeoriPaymentRequest;
    const { type, id, returnUrl, amount: amountOverride, description: descriptionOverride } = body;

    // Validate required fields
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing required fields: type and id' }, { status: 400 });
    }

    if (type !== 'teori') {
      return NextResponse.json({ error: 'Invalid type. Must be teori' }, { status: 400 });
    }

    logger.info('payment', 'Creating unified Teori checkout', { type, id });

    // Check if Teori is enabled
    const isEnabled = await teoriService.isEnabled();
    if (!isEnabled) {
      logger.warn('payment', 'Teori checkout requested but service is disabled');
      return NextResponse.json({ error: 'Teori payment is not available' }, { status: 503 });
    }

    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';

    // Handle Teori booking payment
    const [teoriBooking] = await db.select().from(teoriBookings).where(eq(teoriBookings.id, id)).limit(1);
    if (!teoriBooking) {
      return NextResponse.json({ error: 'Teori booking not found' }, { status: 404 });
    }

    // Get session info for description
    const [session] = await db.select().from(teoriSessions).where(eq(teoriSessions.id, teoriBooking.sessionId)).limit(1);

    // Get customer info
    let customerEmail = '';
    let customerPhone = '';
    let customerFirstName = '';
    let customerLastName = '';

    if (teoriBooking.studentId) {
      const [user] = await db.select().from(users).where(eq(users.id, teoriBooking.studentId)).limit(1);
      if (user) {
        customerEmail = user.email || '';
        customerPhone = user.phone || '';
        customerFirstName = user.firstName || '';
        customerLastName = user.lastName || '';
      }
    }

    const checkoutParams = {
      amount: amountOverride != null ? Number(amountOverride) : Number(teoriBooking.price || 0), // Amount in SEK
      reference: `teori_${teoriBooking.id}`,
      description: descriptionOverride || session?.title || 'Teorilektion',
      returnUrl: returnUrl || `${baseUrl}/dashboard/student/teori`,
      teoriBookingId: teoriBooking.id,
      customerEmail,
      customerPhone,
      customerFirstName,
      customerLastName,
    };

    logger.info('payment', 'Creating Teori checkout with unified params', {
      type,
      id,
      amount: checkoutParams.amount,
      reference: checkoutParams.reference
    });

    // Create checkout session with order tracking
    const checkoutResult = await teoriService.getOrCreateCheckout(checkoutParams);

    logger.info('payment', `Teori unified checkout ${checkoutResult.isExisting ? 'reused' : 'created'} successfully`, {
      type,
      id,
      checkoutId: checkoutResult.checkoutId,
      reference: checkoutParams.reference,
      isExisting: checkoutResult.isExisting
    });

    return NextResponse.json({
      success: true,
      type,
      id,
      checkoutId: checkoutResult.checkoutId,
      checkoutUrl: checkoutResult.checkoutUrl,
      merchantReference: checkoutResult.merchantReference,
      isExisting: checkoutResult.isExisting,
    });

  } catch (error) {
    const anyErr = error as any;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = typeof anyErr?.status === 'number' ? anyErr.status : 500;

    logger.error('payment', 'Failed to create unified Teori checkout', {
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
