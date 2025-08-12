import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    const bodyJson = await request.json().catch(() => ({}));
    let {
      apiUrl,
      apiKey,
      apiSecret,
      customer = {}
    } = bodyJson || {};

    // Load defaults from site_settings if not provided in request
    try {
      const rows = await db.select().from(siteSettings).where(eq(siteSettings.category, 'payment'));
      const map = rows.reduce((acc: Record<string, string>, s: any) => { acc[s.key] = s.value || ''; return acc; }, {} as Record<string, string>);
      if (!apiKey) apiKey = map['qliro_api_key'] || map['qliro_prod_api_key'] || apiKey;
      if (!apiSecret) apiSecret = map['qliro_api_secret'] || map['qliro_secret'] || apiSecret;
      if (!apiUrl) apiUrl = map['qliro_dev_api_url'] || map['qliro_prod_api_url'] || 'https://playground.qliro.com';
    } catch {}

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';
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

    const url = `${envApiUrl.replace(/\/$/, '')}/checkout/merchantapi/Orders`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': generateAuthHeader(body, apiSecret),
    } as Record<string, string>;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({
        error: 'Qliro API error',
        url,
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        request: {
          payload: { ...body, MerchantApiKey: body.MerchantApiKey ? '***' : undefined },
          authorizationPreview: (headers.Authorization || '').replace(/^Qliro\s+/, '').slice(0, 12) + '...'
        }
      }, { status: res.status });
    }
    const data = JSON.parse(text);
    return NextResponse.json({
      success: true,
      url,
      request: {
        payload: { ...body, MerchantApiKey: body.MerchantApiKey ? '***' : undefined },
        authorizationPreview: (headers.Authorization || '').replace(/^Qliro\s+/, '').slice(0, 12) + '...'
      },
      status: res.status,
      statusText: res.statusText,
      order: data,
      checkoutUrl: data.PaymentLink,
      orderId: data.OrderId,
      merchantReference: reference
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create test order', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}




