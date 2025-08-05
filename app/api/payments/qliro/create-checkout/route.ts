import { NextRequest, NextResponse } from 'next/server';
import { qliroService } from '@/lib/payment/qliro-service';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, reference, description, returnUrl, customerEmail, customerPhone, customerFirstName, customerLastName } = body;

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
      // In development, provide fallback to mock mode
      if (process.env.NODE_ENV === 'development') {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.json({
          success: true,
          checkoutId: `mock_${reference}`,
          checkoutUrl: `${baseUrl}/mock-qliro-checkout?purchase=${reference}&amount=${amount}`,
          merchantReference: reference,
          mock: true,
          reason: 'service_disabled'
        });
      }
      return NextResponse.json({ error: 'Qliro payment is not available' }, { status: 503 });
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
      reference,
      isMock: checkoutResult.checkoutId.startsWith('mock_')
    });

    return NextResponse.json({
      success: true,
      checkoutId: checkoutResult.checkoutId,
      checkoutUrl: checkoutResult.checkoutUrl,
      merchantReference: checkoutResult.merchantReference,
      mock: checkoutResult.checkoutId.startsWith('mock_'),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('payment', 'Failed to create Qliro checkout session', {
      error: errorMessage
    });

    // Provide fallback in development mode
    if (process.env.NODE_ENV === 'development') {
      const body = await request.clone().json();
      const { amount, reference } = body;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      logger.warn('payment', 'Falling back to mock mode due to error', {
        error: errorMessage,
        reference
      });
      
      return NextResponse.json({
        success: true,
        checkoutId: `mock_${reference}`,
        checkoutUrl: `${baseUrl}/mock-qliro-checkout?purchase=${reference}&amount=${amount}`,
        merchantReference: reference,
        mock: true,
        fallback: true,
        error: errorMessage
      });
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
