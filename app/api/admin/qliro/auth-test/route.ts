import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireAuthAPI } from '@/lib/auth/server-auth'

export const runtime = 'nodejs'

type AuthTestBody = {
  apiKey: string
  apiSecret: string
  environment?: 'sandbox' | 'production'
  apiUrl?: string
  returnUrl?: string
}

function buildPayload(apiKey: string, returnUrl: string) {
  return {
    MerchantApiKey: apiKey,
    MerchantReference: `auth_test_${Date.now()}`,
    Currency: 'SEK',
    Country: 'SE',
    Language: 'sv-se',
    MerchantTermsUrl: returnUrl.replace(/\/[?#].*$/, '') + '/kopvillkor',
    MerchantConfirmationUrl: returnUrl,
    MerchantCheckoutStatusPushUrl: returnUrl.replace(/\/[?#].*$/, '') + '/api/payments/qliro/webhook-test',
    OrderItems: [{
      MerchantReference: 'auth_test_item',
      Description: 'Auth test order',
      Type: 'Product',
      Quantity: 1,
      PricePerItemIncVat: 1,
      PricePerItemExVat: Number((1 / 1.25).toFixed(2)),
      VatRate: 25
    }]
  }
}

function tokensForPayload(payloadString: string, secret: string) {
  // Try a few documented/observed variants
  return [
    { scheme: 'hmac-hex', token: crypto.createHmac('sha256', secret).update(payloadString).digest('hex') },
    { scheme: 'hmac-base64', token: crypto.createHmac('sha256', secret).update(payloadString).digest('base64') },
    { scheme: 'sha256-hex(body+secret)', token: crypto.createHash('sha256').update(payloadString + secret).digest('hex') },
    { scheme: 'sha256-base64(body+secret)', token: crypto.createHash('sha256').update(payloadString + secret).digest('base64') },
  ]
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthAPI('admin')
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  try {
    const body = (await req.json().catch(() => ({}))) as AuthTestBody
    const apiKey = String(body.apiKey || '').trim()
    const apiSecret = String(body.apiSecret || '').trim()
    const env = (body.environment === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
    const baseUrl = body.apiUrl?.trim() || (env === 'production' ? 'https://payments.qit.nu' : 'https://pago.qit.nu')
    const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const returnUrl = body.returnUrl?.trim() || (publicAppUrl ? `${publicAppUrl.replace(/\/$/, '')}/payments/qliro/thank-you?authTest=1` : 'https://example.com/thank-you')

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'apiKey and apiSecret are required' }, { status: 400 })
    }

    const payload = buildPayload(apiKey, returnUrl)
    const payloadString = JSON.stringify(payload)
    const url = `${baseUrl.replace(/\/$/, '')}/checkout/merchantapi/Orders`

    const attempts: Array<{ scheme: string; status?: number; statusText?: string; ok?: boolean; body?: string }> = []

    for (const t of tokensForPayload(payloadString, apiSecret)) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Qliro ${t.token}`,
            'User-Agent': 'TrafikskolaX-AuthTest/1.0'
          },
          body: payloadString,
        })
        const text = await res.text().catch(() => '')
        attempts.push({ scheme: t.scheme, status: res.status, statusText: res.statusText, ok: res.ok, body: text.slice(0, 1000) })
        if (res.ok) {
          let data: any = {}
          try { data = JSON.parse(text) } catch {}
          return NextResponse.json({
            success: true,
            message: 'Authorization succeeded',
            url,
            scheme: t.scheme,
            details: {
              orderId: data?.OrderId,
              checkoutUrl: data?.PaymentLink,
            },
            attempts
          })
        }
      } catch (e: any) {
        attempts.push({ scheme: t.scheme, status: 0, statusText: e?.message || 'fetch error' })
      }
    }

    return NextResponse.json({
      success: false,
      message: 'All auth variants failed',
      url,
      attempts
    }, { status: 502 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Auth test failed' }, { status: 500 })
  }
}


