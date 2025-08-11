import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';

function generateAuthHeader(payload: any, secret: string): string {
  const payloadString = payload ? JSON.stringify(payload) : '';
  // @ts-ignore
  const crypto = require('crypto');
  const input = payloadString + secret;
  const hash = crypto.createHash('sha256').update(input).digest('base64');
  return `Qliro ${hash}`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const {
      apiUrl,
      apiKey = 'QTEST',
      apiSecret = 'vbQpPxuqvE4K',
      customer = {}
    } = await request.json();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const envApiUrl = apiUrl || 'https://playground.qliro.com';

    const reference = `test_${Date.now()}`;
    const body = {
      MerchantApiKey: apiKey,
      MerchantReference: reference,
      Currency: 'SEK',
      Country: 'SE',
      Language: 'sv-se',
      MerchantTermsUrl: `${baseUrl}/kopvillkor`,
      MerchantConfirmationUrl: `${baseUrl}/qliro/start/booking_${reference}`,
      MerchantCheckoutStatusPushUrl: `${baseUrl}/api/payments/qliro/checkout-push?token=test` ,
      OrderItems: [
        {
          MerchantReference: reference,
          Description: 'Test order',
          Type: 'Product',
          Quantity: 1,
          PricePerItemIncVat: 100,
          PricePerItemExVat: 100,
          VatRate: 0,
        },
      ],
      CustomerInformation: {
        Email: customer.email || 'qliroB2C@qliro.com',
        MobileNumber: customer.phone ? parseInt(String(customer.phone).replace(/\D/g, '')) : 46101010101,
        JuridicalType: 'Physical',
        Address: {
          FirstName: customer.firstName || 'Test',
          LastName: customer.lastName || 'Person',
          Street: 'Sveavägen 151',
          PostalCode: 12345,
          City: 'Stockholm',
        },
      },
    };

    const res = await fetch(`${envApiUrl}/checkout/merchantapi/Orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': generateAuthHeader(body, apiSecret),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: 'Qliro API error', details: text }, { status: res.status });
    }
    const data = JSON.parse(text);
    return NextResponse.json({ success: true, order: data, checkoutUrl: data.PaymentLink, orderId: data.OrderId, merchantReference: reference });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create test order', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}




