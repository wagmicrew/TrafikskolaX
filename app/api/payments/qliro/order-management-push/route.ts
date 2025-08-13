import { NextRequest, NextResponse } from 'next/server';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Qliro-Signature') || '';
    const body = await request.text();

    logger.info('payment', 'Received Qliro order-management-push', {
      hasSignature: !!signature,
      bodyLength: body.length
    });

    const isValid = await qliroService.verifyWebhookSignature(signature, body);
    if (!isValid) {
      logger.warn('payment', 'Invalid Qliro order-management-push signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // As of now, we acknowledge these events; booking/package updates are handled by webhook or checkout-push
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('payment', 'order-management-push handler error', { error: (error as Error).message });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

// Lightweight order management status push endpoint for Qliro
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    return NextResponse.json({ received: true, length: body.length }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


