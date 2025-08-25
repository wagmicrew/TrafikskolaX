import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { teoriService } from '@/lib/payment/teori-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });
    }

    console.log('[TEORI DEBUG] Get order request for orderId:', orderId);

    // Check if Teori is enabled
    const isEnabled = await teoriService.isEnabled();
    if (!isEnabled) {
      return NextResponse.json({ error: 'Teori payment is not available' }, { status: 503 });
    }

    // Get order details from Teori
    const order = await teoriService.getOrder(orderId);
    
    console.log('[TEORI DEBUG] Get order response:', {
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
    console.error('[TEORI DEBUG] Get order error:', error);
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
