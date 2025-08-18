import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';

export const runtime = 'nodejs';

type Body = {
  bookingId?: string;
  handledarBookingId?: string;
  packagePurchaseId?: string;
  returnUrl?: string;
};

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    logger.info('payment', 'Raw request body', { rawBody, length: rawBody.length });
    
    let body: Body;
    try {
      body = JSON.parse(rawBody || '{}') as Body;
    } catch (parseError) {
      logger.error('payment', 'JSON parse error', { parseError, rawBody });
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { bookingId, handledarBookingId, packagePurchaseId } = body;
    
    // Check if body is empty or malformed
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      logger.error('payment', 'Empty or malformed request body', {
        body,
        bodyType: typeof body,
        rawBody,
        rawBodyLength: rawBody.length
      });
      return NextResponse.json({ error: 'Request body is empty or malformed' }, { status: 400 });
    }
    
    // Additional debugging for handledar bookings
    if (handledarBookingId) {
      logger.info('payment', 'Handledar booking detected', {
        handledarBookingId,
        handledarBookingIdType: typeof handledarBookingId,
        handledarBookingIdLength: handledarBookingId?.length,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(handledarBookingId || '')
      });
    }

    // Debug logging
    logger.info('payment', 'Qliro create-order received', {
      body,
      bookingId,
      handledarBookingId,
      packagePurchaseId,
      bodyType: typeof body,
      bodyKeys: Object.keys(body || {}),
      rawBody: rawBody,
      bodyLength: rawBody.length
    });

    const picks = [bookingId, handledarBookingId, packagePurchaseId].filter(Boolean);
    logger.info('payment', 'Parameter validation', {
      bookingId,
      handledarBookingId,
      packagePurchaseId,
      picks,
      picksLength: picks.length,
      bodyKeys: Object.keys(body || {}),
      hasBookingId: !!bookingId,
      hasHandledarBookingId: !!handledarBookingId,
      hasPackagePurchaseId: !!packagePurchaseId
    });
    
    if (picks.length !== 1) {
      logger.warn('payment', 'Invalid parameters for create-order', {
        picks,
        picksLength: picks.length,
        body,
        bookingId,
        handledarBookingId,
        packagePurchaseId
      });
      return NextResponse.json({ error: 'Provide exactly one of bookingId, handledarBookingId, packagePurchaseId' }, { status: 400 });
    }

    // Resolve public URL and defaults
    const resolved = await qliroService.getResolvedSettings(false);
    
    // Try to get the correct base URL from multiple sources
    let baseUrl = resolved.publicUrl || process.env.NEXT_PUBLIC_APP_URL || '';
    
    // If we don't have a proper URL, try to construct it from the request
    if (!baseUrl || baseUrl.includes('localhost') || !baseUrl.startsWith('https://')) {
      const requestOrigin = req.headers.get('origin') || req.headers.get('host');
      if (requestOrigin) {
        // Extract the host from origin or construct from host header
        const host = requestOrigin.startsWith('http') 
          ? new URL(requestOrigin).host 
          : requestOrigin;
        
        // Use HTTPS for production domains
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          baseUrl = `https://${host}`;
        }
      }
    }
    
    // Final fallback to environment variable
    if (!baseUrl || baseUrl.includes('localhost') || !baseUrl.startsWith('https://')) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    }
    
    if (!baseUrl || !baseUrl.startsWith('https://')) {
      logger.error('payment', 'Invalid public URL for Qliro return', { 
        baseUrl, 
        resolvedPublicUrl: resolved.publicUrl,
        envUrl: process.env.NEXT_PUBLIC_APP_URL,
        requestOrigin: req.headers.get('origin'),
        requestHost: req.headers.get('host')
      });
      return NextResponse.json({ error: 'Public https URL not configured' }, { status: 500 });
    }
    
    logger.info('payment', 'Using base URL for Qliro return', { baseUrl });

    let amount = 0;
    let description = 'Betalning';
    let reference = '';
    let customerEmail: string | undefined;
    let customerPhone: string | undefined;
    let customerFirstName: string | undefined;
    let customerLastName: string | undefined;
    let returnUrl = body.returnUrl || `${baseUrl}/payments/qliro/thank-you`;

    if (bookingId) {
      const rows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
      const b = rows[0] as any;
      if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      amount = Number(b.totalPrice || 0);
      description = `Bokning ${bookingId.slice(0, 8)}`;
      reference = `booking_${bookingId}`;
      if (b.userId) {
        const [u] = (await db.select().from(users).where(eq(users.id, b.userId)).limit(1)) as any[];
        if (u) {
          customerEmail = u.email || undefined;
          customerPhone = (u.phone || '').toString() || undefined;
          customerFirstName = u.firstName || undefined;
          customerLastName = u.lastName || undefined;
        }
      } else if (b.guestEmail) {
        customerEmail = b.guestEmail;
        customerPhone = b.guestPhone || undefined;
        customerFirstName = (b.guestName || '').split(' ')[0] || undefined;
        customerLastName = (b.guestName || '').split(' ').slice(1).join(' ') || undefined;
      }
      returnUrl = `${baseUrl}/qliro/return?ref=${encodeURIComponent(`booking_${bookingId}`)}`;
    }

    if (handledarBookingId) {
      logger.info('payment', 'Looking up handledar booking', { handledarBookingId });
      
      const rows = await db.select().from(handledarBookings).where(eq(handledarBookings.id, handledarBookingId)).limit(1);
      const hb = rows[0] as any;
      
      if (!hb) {
        logger.error('payment', 'Handledar booking not found in database', { 
          handledarBookingId,
          searchedRows: rows.length,
          allHandledarBookings: await db.select({ id: handledarBookings.id }).from(handledarBookings).limit(5)
        });
        return NextResponse.json({ error: 'Handledarkurs-bokning saknas' }, { status: 404 });
      }
      
      logger.info('payment', 'Handledar booking found', { 
        bookingId: hb.id,
        price: hb.price,
        paymentStatus: hb.paymentStatus,
        supervisorEmail: hb.supervisorEmail
      });
      
      amount = Number(hb.price || 0);
      description = `Handledarkurs ${handledarBookingId.slice(0, 8)}`;
      reference = `handledar_${handledarBookingId}`;
      customerEmail = hb.supervisorEmail || undefined;
      customerPhone = hb.supervisorPhone || undefined;
      returnUrl = `${baseUrl}/qliro/return?ref=${encodeURIComponent(`handledar_${handledarBookingId}`)}`;
    }

    if (packagePurchaseId) {
      const rows = await db.select().from(packagePurchases).where(eq(packagePurchases.id, packagePurchaseId)).limit(1);
      const p = rows[0] as any;
      if (!p) return NextResponse.json({ error: 'Paketköp saknas' }, { status: 404 });
      amount = Number(p.pricePaid || 0);
      description = `Paketköp ${packagePurchaseId.slice(0, 8)}`;
      reference = `package_${packagePurchaseId}`;
      if (p.userId) {
        const [u] = (await db.select().from(users).where(eq(users.id, p.userId)).limit(1)) as any[];
        if (u) {
          customerEmail = u.email || undefined;
          customerPhone = (u.phone || '').toString() || undefined;
          customerFirstName = u.firstName || undefined;
          customerLastName = u.lastName || undefined;
        }
      }
      returnUrl = `${baseUrl}/qliro/return?ref=${encodeURIComponent(`package_${packagePurchaseId}`)}`;
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount for order' }, { status: 400 });
    }

    logger.info('payment', 'Unified Qliro create order', { 
      reference, 
      amount, 
      description, 
      returnUrl,
      baseUrl 
    });

    const result = await qliroService.getOrCreateCheckout({
      amount,
      reference,
      description,
      returnUrl,
      bookingId: bookingId || undefined,
      handledarBookingId: handledarBookingId || undefined,
      packagePurchaseId: packagePurchaseId || undefined,
      customerEmail,
      customerPhone,
      customerFirstName,
      customerLastName,
    });

    return NextResponse.json({ success: true, checkoutId: result.checkoutId, checkoutUrl: result.checkoutUrl, merchantReference: result.merchantReference, isExisting: result.isExisting });
  } catch (e: any) {
    console.error('[QLIRO DEBUG] ERROR in create-order:', e);
    console.error('[QLIRO DEBUG] Error details:', {
      message: e?.message,
      status: e?.status,
      statusText: e?.statusText,
      body: e?.body,
      stack: e?.stack?.split('\n').slice(0, 5)
    });
    
    return NextResponse.json({
      error: `QLIRO DEBUG: ${e?.message || 'Failed to create order'}`,
      debug: { 
        errorType: e?.constructor?.name, 
        status: e?.status,
        statusText: e?.statusText,
        body: e?.body,
        stack: e?.stack?.split('\n').slice(0, 3) 
      }
    }, { status: 500 });
  }
}


