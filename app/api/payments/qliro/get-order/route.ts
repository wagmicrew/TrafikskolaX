import { NextRequest, NextResponse } from 'next/server';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Ensure Qliro is enabled
    const enabled = await qliroService.isEnabled();
    if (!enabled) {
      return NextResponse.json({ error: 'Qliro is not available' }, { status: 503 });
    }

    // Get order with HTML snippet
    const orderData = await qliroService.getOrder(orderId);
    
    logger.debug('payment', 'Qliro GetOrder response', { 
      orderId, 
      hasHtmlSnippet: !!orderData.OrderHtmlSnippet,
      status: orderData.CustomerCheckoutStatus
    });

    return NextResponse.json({
      success: true,
      orderId: orderData.OrderId,
      htmlSnippet: orderData.OrderHtmlSnippet,
      status: orderData.CustomerCheckoutStatus,
      totalPrice: orderData.TotalPrice,
      currency: orderData.Currency,
      merchantReference: orderData.MerchantReference
    });

  } catch (error) {
    logger.error('payment', 'Qliro GetOrder failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get order' 
    }, { status: 500 });
  }
}
