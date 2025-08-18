import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { qliroService } from '@/lib/payment/qliro-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });
    }

    console.log('[QLIRO DEBUG] Get order request for orderId:', orderId);

    // Check if Qliro is enabled
    const isEnabled = await qliroService.isEnabled();
    if (!isEnabled) {
      return NextResponse.json({ error: 'Qliro payment is not available' }, { status: 503 });
    }

    // Get order details from Qliro
    const order = await qliroService.getOrder(orderId);
    
    console.log('[QLIRO DEBUG] Get order response:', {
      orderId: order?.OrderId,
      hasHtmlSnippet: !!order?.OrderHtmlSnippet,
      status: order?.CustomerCheckoutStatus,
      totalPrice: order?.TotalPriceIncVat
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);

  } catch (error: any) {
    console.error('[QLIRO DEBUG] Get order error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to get order',
      debug: { 
        errorType: error?.constructor?.name,
        status: error?.status,
        statusText: error?.statusText
      }
    }, { status: 500 });
  }
}