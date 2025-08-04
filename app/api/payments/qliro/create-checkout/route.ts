import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, reference, description, returnUrl } = body;

    // Log the request
    logger.info('Creating Qliro checkout', { 
      amount, 
      reference, 
      description, 
      returnUrl 
    });

    // Validate required fields
    if (!amount || !reference || !description || !returnUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, reference, description, returnUrl' },
        { status: 400 }
      );
    }

    // Get Qliro credentials from environment
    const qliroMerchantId = process.env.QLIRO_MERCHANT_ID;
    const qliroApiKey = process.env.QLIRO_API_KEY;
    const qliroApiUrl = process.env.QLIRO_API_URL || 'https://playground.qliro.com'; // Use playground for now

    if (!qliroMerchantId || !qliroApiKey) {
      logger.error('Qliro credentials not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Create checkout payload
    const checkoutPayload = {
      MerchantReference: reference,
      CountryCode: 'SE',
      CurrencyCode: 'SEK',
      OrderItems: [
        {
          MerchantReference: reference,
          Description: description,
          Quantity: 1,
          PricePerItemIncludingVat: amount * 100, // Convert to öre (smallest currency unit)
          VatRate: 0, // Assume 0% VAT for driving lessons
        }
      ],
      TotalOrderValue: amount * 100, // Convert to öre
      TotalOrderValueIncludingVat: amount * 100,
      TotalOrderValueExcludingVat: amount * 100,
      TotalVatAmount: 0,
      Customer: {
        Email: '', // Will be filled by customer during checkout
      },
      PaymentMethods: ['Card', 'Invoice', 'Installment'],
      Gui: {
        ColorScheme: 'White',
        Locale: 'sv-SE',
      },
      MerchantConfirmationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/qliro/webhook`,
      MerchantNotificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/qliro/webhook`,
      CheckoutCompletedCallbackUrl: returnUrl,
    };

    // Make request to Qliro API
    const qliroResponse = await fetch(`${qliroApiUrl}/v2/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${qliroMerchantId}:${qliroApiKey}`).toString('base64')}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!qliroResponse.ok) {
      const errorText = await qliroResponse.text();
      logger.error('Qliro API error', { 
        status: qliroResponse.status, 
        error: errorText 
      });
      return NextResponse.json(
        { error: 'Failed to create checkout' },
        { status: qliroResponse.status }
      );
    }

    const checkoutData = await qliroResponse.json();
    
    logger.info('Qliro checkout created successfully', { 
      checkoutId: checkoutData.CheckoutId,
      reference 
    });

    return NextResponse.json({
      checkoutId: checkoutData.CheckoutId,
      checkoutUrl: checkoutData.CheckoutHtmlSnippet ? 
        `${qliroApiUrl}/checkout/${checkoutData.CheckoutId}` : 
        checkoutData.CheckoutUrl,
      merchantReference: reference,
    });

  } catch (error) {
    logger.error('Error creating Qliro checkout', { error: error instanceof Error ? error.message : 'Unknown error' });
    console.error('Qliro checkout creation error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
