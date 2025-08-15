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
  var ATTACHED = false;
  var POLL_MAX_MS = 60000; // 60s
  var POLL_INTERVAL_MS = 300;

  function send(type, data) {
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'qliro:' + type, data: data || null, orderId: ORDER_ID }, '*');
      }
    } catch (e) {
      try { console.warn('[Qliro q1ready] postMessage failed', e); } catch (_) {}
    }
  }

  // Forward runtime errors to parent for diagnostics
  try {
    window.addEventListener('error', function (e) {
      try {
        var err = e.error || {};
        send('error', {
          source: 'onerror',
          message: e.message || (err && err.message) || String(e),
          filename: e.filename || (e.target && e.target.src) || '',
          lineno: e.lineno || 0,
          colno: e.colno || 0,
          stack: (err && err.stack) || null
        });
      } catch (_) {}
    }, true);
  } catch (_) {}

  try {
    window.addEventListener('unhandledrejection', function (e) {
      try {
        var r = e.reason;
        send('error', {
          source: 'unhandledrejection',
          message: (r && (r.message || r.toString && r.toString())) || 'Unhandled promise rejection',
          stack: r && r.stack ? r.stack : null
        });
      } catch (_) {}
    });
  } catch (_) {}

  // Define q1Ready. Qliro may call with q1 or rely on window.q1
  window.q1Ready = function (q1Arg) {
    try {
      if (ATTACHED) { return; }
      var q1 = q1Arg || window.q1;
      if (!q1) {
        try { console.log('[Qliro q1ready] q1 not available yet'); } catch (_) {}
        return;
      }

      ATTACHED = true;
      send('bootstrap', { stage: 'q1Ready', attached: true });

      // Listeners mirroring the inline version from raw route
      if (q1.onCheckoutLoaded) q1.onCheckoutLoaded(function () { send('onCheckoutLoaded'); });
      if (q1.onCustomerInfoChanged) q1.onCustomerInfoChanged(function (p) { send('onCustomerInfoChanged', p); });
      if (q1.onOrderUpdated) q1.onOrderUpdated(function (p) { send('onOrderUpdated', p); });
      if (q1.onPaymentMethodChanged) q1.onPaymentMethodChanged(function (p) { send('onPaymentMethodChanged', p); });
      if (q1.onPaymentDeclined) q1.onPaymentDeclined(function (arg1, arg2) {
        var payload = (arg1 && typeof arg1 === 'object') ? arg1 : { reason: arg1, message: arg2 };
        send('onPaymentDeclined', payload);
      });
      if (q1.onPaymentProcess) {
        var attached = false;
        // Prefer two-callback signature: (startCb, endCb)
        try {
          q1.onPaymentProcess(
            function () { send('onPaymentProcess:start'); },
            function (p) {
              send('onPaymentProcess:end', p);
              try {
                if (p && (p.status === 'Completed' || p.status === 'Paid')) {
                  send('completed', p);
                  try { window.close(); } catch (_) {}
                }
              } catch (_) {}
            }
          );
          attached = true;
        } catch (_) {}
        // Fallback to single-callback signature
        if (!attached) {
          try {
            q1.onPaymentProcess(function (p) {
              send('onPaymentProcess', p);
              try {
                if (p && (p.status === 'Completed' || p.status === 'Paid')) {
                  send('completed', p);
                  try { window.close(); } catch (_) {}
                }
              } catch (_) {}
            });
            attached = true;
          } catch (_) {}
        }
      }
      if (q1.onSessionExpired) q1.onSessionExpired(function (p) { send('onSessionExpired', p); });
      if (q1.onCustomerDeauthenticating) q1.onCustomerDeauthenticating(function (p) { send('onCustomerDeauthenticating', p); });
      if (q1.onShippingMethodChanged) q1.onShippingMethodChanged(function (p) { send('onShippingMethodChanged', p); });
      if (q1.onShippingPriceChanged) q1.onShippingPriceChanged(function (p) { send('onShippingPriceChanged', p); });

      try { console.log('[Qliro q1ready] listeners attached'); } catch (_) {}
    } catch (e) {
      try { console.log('[Qliro q1ready] Listener setup error', e); } catch (_) {}
    }
  };

  // Immediately signal popup boot to parent for diagnostics
  send('popup:boot', { ts: Date.now(), href: (function(){ try { return location.href; } catch(_) { return '' } })() });

  // Self-initialize if Qliro never invokes q1Ready: poll for window.q1 and attach once
  (function pollForQ1() {
    var start = Date.now();
    var timer = setInterval(function () {
      try {
        if (ATTACHED) { clearInterval(timer); return; }
        var q1 = window.q1;
        if (q1) {
          send('q1Detected');
          try { window.q1Ready(q1); } catch (_) {}
        }
        if (Date.now() - start > POLL_MAX_MS) {
          clearInterval(timer);
          send('bootstrap:timeout', { waitedMs: Date.now() - start });
        }
      } catch (_) {
        // Ignore
      }
    }, POLL_INTERVAL_MS);
  })();
})();

