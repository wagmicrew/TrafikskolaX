import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { qliroService } from '@/lib/payment/qliro-service';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases, packages, users, handledarSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logging/logger';

interface UnifiedPaymentRequest {
  type: 'booking' | 'package' | 'handledar';
  id: string;
  returnUrl?: string;
  amount?: number; // Optional override
  description?: string; // Optional override
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as UnifiedPaymentRequest;
    const { type, id, returnUrl, amount: amountOverride, description: descriptionOverride } = body;

    // Validate required fields
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing required fields: type and id' }, { status: 400 });
    }

    if (!['booking', 'package', 'handledar'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be booking, package, or handledar' }, { status: 400 });
    }

    logger.info('payment', 'Creating unified Qliro checkout', { type, id });

    // Check if Qliro is enabled
    const isEnabled = await qliroService.isEnabled();
    if (!isEnabled) {
      logger.warn('payment', 'Qliro checkout requested but service is disabled');
      return NextResponse.json({ error: 'Qliro payment is not available' }, { status: 503 });
    }

    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';
    let checkoutParams: any = {};

    // Handle different payment types
    switch (type) {
      case 'booking': {
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Get customer info
        let customerEmail = booking.guestEmail || '';
        let customerPhone = booking.guestPhone || '';
        let customerFirstName = booking.guestName || '';
        let customerLastName = '';

        if (booking.userId) {
          const [user] = await db.select().from(users).where(eq(users.id, booking.userId)).limit(1);
          if (user) {
            customerEmail = user.email || customerEmail;
            customerPhone = user.phone || customerPhone;
            customerFirstName = user.firstName || customerFirstName;
            customerLastName = user.lastName || customerLastName;
          }
        }

        checkoutParams = {
          amount: amountOverride != null ? Number(amountOverride) : Number(booking.totalPrice || 0), // Amount in SEK
          reference: `booking_${booking.id}`,
          description: descriptionOverride || 'Körlektion',
          returnUrl: returnUrl || `${baseUrl}/dashboard/student/bokningar/${booking.id}`,
          bookingId: booking.id,
          customerEmail,
          customerPhone,
          customerFirstName,
          customerLastName,
        };
        break;
      }

      case 'package': {
        const [purchase] = await db.select().from(packagePurchases).where(eq(packagePurchases.id, id)).limit(1);
        if (!purchase) {
          return NextResponse.json({ error: 'Package purchase not found' }, { status: 404 });
        }

        const [pkg] = await db.select().from(packages).where(eq(packages.id, purchase.packageId)).limit(1);
        const [user] = await db.select().from(users).where(eq(users.id, purchase.userId)).limit(1);

        checkoutParams = {
          amount: amountOverride != null ? Number(amountOverride) : Number(purchase.pricePaid || 0), // Amount in SEK
          reference: `package_${purchase.id}`,
          description: descriptionOverride || pkg?.name || 'Paket',
          returnUrl: returnUrl || `${baseUrl}/dashboard/student`,
          packagePurchaseId: purchase.id,
          customerEmail: user?.email,
          customerPhone: user?.phone || undefined,
          customerFirstName: user?.firstName || undefined,
          customerLastName: user?.lastName || undefined,
        };
        break;
      }

      case 'handledar': {
        const [handledarBooking] = await db.select().from(handledarBookings).where(eq(handledarBookings.id, id)).limit(1);
        if (!handledarBooking) {
          return NextResponse.json({ error: 'Handledar booking not found' }, { status: 404 });
        }

        const [session] = await db.select().from(handledarSessions).where(eq(handledarSessions.id, handledarBooking.sessionId)).limit(1);

        // Get customer info - prioritize student, fallback to supervisor
        let customerEmail = handledarBooking.supervisorEmail || '';
        let customerPhone = handledarBooking.supervisorPhone || '';
        let customerFirstName = handledarBooking.supervisorName || '';
        let customerLastName = '';

        if (handledarBooking.studentId) {
          const [user] = await db.select().from(users).where(eq(users.id, handledarBooking.studentId)).limit(1);
          if (user) {
            customerEmail = user.email || customerEmail;
            customerPhone = user.phone || customerPhone;
            customerFirstName = user.firstName || customerFirstName;
            customerLastName = user.lastName || customerLastName;
          }
        }

        checkoutParams = {
          amount: amountOverride != null ? Number(amountOverride) : Number(handledarBooking.price || 0), // Amount in SEK
          reference: `handledar_${handledarBooking.id}`,
          description: descriptionOverride || session?.title || 'Handledarutbildning',
          returnUrl: returnUrl || `${baseUrl}/dashboard/student/handledar`,
          handledarBookingId: handledarBooking.id,
          customerEmail,
          customerPhone,
          customerFirstName,
          customerLastName,
        };
        break;
      }
    }

    logger.info('payment', 'Creating Qliro checkout with unified params', {
      type,
      id,
      amount: checkoutParams.amount,
      reference: checkoutParams.reference
    });

    // Create checkout session with order tracking
    const checkoutResult = await qliroService.getOrCreateCheckout(checkoutParams);

    logger.info('payment', `Qliro unified checkout ${checkoutResult.isExisting ? 'reused' : 'created'} successfully`, {
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

    logger.error('payment', 'Failed to create unified Qliro checkout', {
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
