/* Qliro q1Ready external script (CSP-safe)
   - Reads orderId from <script data-order-id>
   - Defines window.q1Ready (accepts optional q1 param)
   - Forwards events to window.opener via postMessage('qliro:*')
*/
(function () {
  function getOrderId() {
    try {
      var s = document.currentScript || document.querySelector('script[src*="/qliro/q1ready.js"]');
      return (s && s.getAttribute('data-order-id')) || '';
    } catch (e) {
      return '';
    }
  }

  var ORDER_ID = getOrderId();

  function send(type, data) {
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'qliro:' + type, data: data || null, orderId: ORDER_ID }, '*');
      }
    } catch (e) {
      try { console.warn('[Qliro q1ready] postMessage failed', e); } catch (_) {}
    }
  }

  // Define q1Ready. Qliro may call with q1 or rely on window.q1
  window.q1Ready = function (q1Arg) {
    try {
      var q1 = q1Arg || window.q1;
      if (!q1) {
        try { console.log('[Qliro q1ready] q1 not available yet'); } catch (_) {}
        return;
      }

      // Listeners mirroring the inline version from raw route
      if (q1.onCheckoutLoaded) q1.onCheckoutLoaded(function () { send('onCheckoutLoaded'); });
      if (q1.onCustomerInfoChanged) q1.onCustomerInfoChanged(function (p) { send('onCustomerInfoChanged', p); });
      if (q1.onOrderUpdated) q1.onOrderUpdated(function (p) { send('onOrderUpdated', p); });
      if (q1.onPaymentMethodChanged) q1.onPaymentMethodChanged(function (p) { send('onPaymentMethodChanged', p); });
      if (q1.onPaymentDeclined) q1.onPaymentDeclined(function (p) { send('onPaymentDeclined', p); });
      if (q1.onPaymentProcess) q1.onPaymentProcess(function (p) {
        send('onPaymentProcess', p);
        try {
          if (p && (p.status === 'Completed' || p.status === 'Paid')) {
            send('completed', p);
            try { window.close(); } catch (_) {}
          }
        } catch (_) {}
      });
      if (q1.onSessionExpired) q1.onSessionExpired(function (p) { send('onSessionExpired', p); });
      if (q1.onCustomerDeauthenticating) q1.onCustomerDeauthenticating(function (p) { send('onCustomerDeauthenticating', p); });
      if (q1.onShippingMethodChanged) q1.onShippingMethodChanged(function (p) { send('onShippingMethodChanged', p); });
      if (q1.onShippingPriceChanged) q1.onShippingPriceChanged(function (p) { send('onShippingPriceChanged', p); });
    } catch (e) {
      try { console.log('[Qliro q1ready] Listener setup error', e); } catch (_) {}
    }
  };
})();
