/*
  Utility to open Qliro checkout in a raw popup window without site wrapper.
  - Fetches HTML snippet via our API: /api/payments/qliro/get-order?orderId=...
  - Writes a minimal HTML document into the popup
  - Defines q1Ready with all listeners and forwards events to window.opener
*/

export async function openQliroPopup(orderId: string, title = 'qliro_window') {
  const width = Math.min(520, Math.floor(window.innerWidth * 0.9));
  const height = Math.min(860, Math.floor(window.innerHeight * 0.95));
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
  const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;

  // Open first to avoid popup blockers
  const win = window.open('about:blank', title, features);
  if (!win) {
    throw new Error('Popup blocker prevented opening Qliro window');
  }

  try {
    // Fetch HTML snippet from our backend
    const res = await fetch(`/api/payments/qliro/get-order?orderId=${encodeURIComponent(orderId)}`);
    const data = await res.json();
    if (!res.ok || !data?.htmlSnippet) {
      throw new Error(data?.error || 'Failed to fetch Qliro order');
    }

    // Minimal HTML shell with q1Ready listeners
    const html = `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Qliro Checkout</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #fff; font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif; }
      .fallback { display: none; }
    </style>
    <script>
      window.q1Ready = function() {
        var q1 = window.q1;
        if (!q1) { console.log('[Qliro Raw] q1 not available'); return; }
        console.log('[Qliro Raw] q1Ready - setting listeners');
        function send(type, data) {
          try { window.opener && window.opener.postMessage({ type: 'qliro:' + type, data: data || null, orderId: ${JSON.stringify(orderId)} }, '*'); } catch (e) {}
        }
        try {
          q1.onCheckoutLoaded && q1.onCheckoutLoaded(function(){ console.log('[Qliro Raw] onCheckoutLoaded'); send('onCheckoutLoaded'); });
          q1.onCustomerInfoChanged && q1.onCustomerInfoChanged(function(p){ console.log('[Qliro Raw] onCustomerInfoChanged', p); send('onCustomerInfoChanged', p); });
          q1.onOrderUpdated && q1.onOrderUpdated(function(p){ console.log('[Qliro Raw] onOrderUpdated', p); send('onOrderUpdated', p); });
          q1.onPaymentMethodChanged && q1.onPaymentMethodChanged(function(p){ console.log('[Qliro Raw] onPaymentMethodChanged', p); send('onPaymentMethodChanged', p); });
          q1.onPaymentDeclined && q1.onPaymentDeclined(function(p){ console.log('[Qliro Raw] onPaymentDeclined', p); send('onPaymentDeclined', p); });
          q1.onPaymentProcess && q1.onPaymentProcess(function(p){ console.log('[Qliro Raw] onPaymentProcess', p); send('onPaymentProcess', p); if (p && (p.status === 'Completed' || p.status === 'Paid')) { send('completed', p); try { window.close(); } catch (e) {} } });
          q1.onSessionExpired && q1.onSessionExpired(function(p){ console.log('[Qliro Raw] onSessionExpired', p); send('onSessionExpired', p); });
          q1.onCustomerDeauthenticating && q1.onCustomerDeauthenticating(function(p){ console.log('[Qliro Raw] onCustomerDeauthenticating', p); send('onCustomerDeauthenticating', p); });
          q1.onShippingMethodChanged && q1.onShippingMethodChanged(function(p){ console.log('[Qliro Raw] onShippingMethodChanged', p); send('onShippingMethodChanged', p); });
          q1.onShippingPriceChanged && q1.onShippingPriceChanged(function(p){ console.log('[Qliro Raw] onShippingPriceChanged', p); send('onShippingPriceChanged', p); });
        } catch (e) { console.log('[Qliro Raw] Listener error', e); }
      };
    </script>
  </head>
  <body>
    ${data.htmlSnippet}
    <noscript class="fallback">Enable JavaScript to use Qliro Checkout</noscript>
  </body>
 </html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  } catch (e) {
    win.close();
    throw e;
  }
}


