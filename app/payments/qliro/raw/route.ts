import { NextRequest, NextResponse } from 'next/server'
import { qliroService } from '@/lib/payment/qliro-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId') || ''
    if (!orderId) {
      return new NextResponse('<!doctype html><html><body><pre>Missing orderId</pre></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    const order = await qliroService.getOrder(orderId)
    const snippet = order?.OrderHtmlSnippet || ''
    if (!snippet) {
      return new NextResponse('<!doctype html><html><body><pre>No OrderHtmlSnippet returned</pre></body></html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    const html = `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Qliro Checkout</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #fff; font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif; }
    </style>
    <script>
      window.q1Ready = function() {
        var q1 = window.q1;
        if (!q1) { try { console.log('[Qliro Raw Route] q1 not available'); } catch(e){} return; }
        function send(type, data) {
          try { window.opener && window.opener.postMessage({ type: 'qliro:' + type, data: data || null, orderId: ${JSON.stringify(orderId)} }, '*'); } catch (e) {}
        }
        try {
          q1.onCheckoutLoaded && q1.onCheckoutLoaded(function(){ send('onCheckoutLoaded'); });
          q1.onCustomerInfoChanged && q1.onCustomerInfoChanged(function(p){ send('onCustomerInfoChanged', p); });
          q1.onOrderUpdated && q1.onOrderUpdated(function(p){ send('onOrderUpdated', p); });
          q1.onPaymentMethodChanged && q1.onPaymentMethodChanged(function(p){ send('onPaymentMethodChanged', p); });
          q1.onPaymentDeclined && q1.onPaymentDeclined(function(p){ send('onPaymentDeclined', p); });
          q1.onPaymentProcess && q1.onPaymentProcess(function(p){ send('onPaymentProcess', p); if (p && (p.status === 'Completed' || p.status === 'Paid')) { send('completed', p); try { window.close(); } catch (e) {} } });
          q1.onSessionExpired && q1.onSessionExpired(function(p){ send('onSessionExpired', p); });
          q1.onCustomerDeauthenticating && q1.onCustomerDeauthenticating(function(p){ send('onCustomerDeauthenticating', p); });
          q1.onShippingMethodChanged && q1.onShippingMethodChanged(function(p){ send('onShippingMethodChanged', p); });
          q1.onShippingPriceChanged && q1.onShippingPriceChanged(function(p){ send('onShippingPriceChanged', p); });
        } catch (e) { try { console.log('[Qliro Raw Route] Listener error', e); } catch(_){} }
      };
    </script>
  </head>
  <body>
    ${snippet}
    <noscript class="fallback">Enable JavaScript to use Qliro Checkout</noscript>
  </body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Frame-Options': 'SAMEORIGIN' }
    })
  } catch (e: any) {
    const msg = e?.message || 'Internal error'
    return new NextResponse(`<!doctype html><html><body><pre>${msg}</pre></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}


