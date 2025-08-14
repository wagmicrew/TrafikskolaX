"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function QliroCheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [htmlSnippet, setHtmlSnippet] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    // Fetch debug setting
    fetch('/api/public/site-settings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setDebugEnabled(!!data?.debug_extended_logs))
      .catch(() => setDebugEnabled(false));
  }, []);

  useEffect(() => {
    if (!orderId) {
      console.log('[Qliro Checkout] No orderId provided in URL params');
      setError('No order ID provided');
      setLoading(false);
      return;
    }
    
    console.log('[Qliro Checkout] Starting with orderId:', orderId);

    // Define q1Ready globally before fetching the order (as per Qliro documentation)
    (window as any).q1Ready = function() {
      const q1 = (window as any).q1;
      if (!q1) {
        if (debugEnabled) console.log('[Qliro] q1Ready called but q1 not available');
        return;
      }

      if (debugEnabled) {
        console.log('[Qliro] q1Ready - Checkout loaded, setting up listeners');
      }

      // Implement all listeners as per Qliro documentation
      // https://developers.qliro.com/docs/qliro-checkout/frontend-features/listeners
      
      // onCheckoutLoaded - Called when the checkout is fully loaded
      q1.onCheckoutLoaded(() => {
        if (debugEnabled) console.log('[Qliro] onCheckoutLoaded');
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onCheckoutLoaded',
            orderId
          }, '*');
        }
      });

      // onCustomerInfoChanged - Called when customer information changes
      q1.onCustomerInfoChanged((customerInfo: any) => {
        if (debugEnabled) console.log('[Qliro] onCustomerInfoChanged:', customerInfo);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onCustomerInfoChanged',
            data: customerInfo,
            orderId
          }, '*');
        }
      });

      // onOrderUpdated - Called when order is updated
      q1.onOrderUpdated((orderData: any) => {
        if (debugEnabled) console.log('[Qliro] onOrderUpdated:', orderData);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onOrderUpdated',
            data: orderData,
            orderId
          }, '*');
        }
      });

      // onPaymentMethodChanged - Called when payment method is changed
      q1.onPaymentMethodChanged((paymentMethod: any) => {
        if (debugEnabled) console.log('[Qliro] onPaymentMethodChanged:', paymentMethod);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onPaymentMethodChanged',
            data: paymentMethod,
            orderId
          }, '*');
        }
      });

      // onPaymentDeclined - Called when payment is declined
      q1.onPaymentDeclined((declineInfo: any) => {
        if (debugEnabled) console.log('[Qliro] onPaymentDeclined:', declineInfo);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onPaymentDeclined',
            data: declineInfo,
            orderId
          }, '*');
        }
      });

      // onPaymentProcess - Called during payment processing
      q1.onPaymentProcess((processData: any) => {
        if (debugEnabled) console.log('[Qliro] onPaymentProcess:', processData);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onPaymentProcess',
            data: processData,
            orderId
          }, '*');
        }
        
        // Check for payment completion
        if (processData?.status === 'Completed' || processData?.status === 'Paid') {
          if (window.opener) {
            window.opener.postMessage({
              type: 'qliro:completed',
              data: processData,
              orderId
            }, '*');
          }
        }
      });

      // onSessionExpired - Called when session expires
      q1.onSessionExpired((sessionData: any) => {
        if (debugEnabled) console.log('[Qliro] onSessionExpired:', sessionData);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onSessionExpired',
            data: sessionData,
            orderId
          }, '*');
        }
      });

      // onCustomerDeauthenticating - Called when customer is deauthenticating
      q1.onCustomerDeauthenticating((deauthData: any) => {
        if (debugEnabled) console.log('[Qliro] onCustomerDeauthenticating:', deauthData);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onCustomerDeauthenticating',
            data: deauthData,
            orderId
          }, '*');
        }
      });

      // onShippingMethodChanged - Called when shipping method changes
      q1.onShippingMethodChanged((shippingData: any) => {
        if (debugEnabled) console.log('[Qliro] onShippingMethodChanged:', shippingData);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onShippingMethodChanged',
            data: shippingData,
            orderId
          }, '*');
        }
      });

      // onShippingPriceChanged - Called when shipping price changes
      q1.onShippingPriceChanged((priceData: any) => {
        if (debugEnabled) console.log('[Qliro] onShippingPriceChanged:', priceData);
        if (window.opener) {
          window.opener.postMessage({
            type: 'qliro:onShippingPriceChanged',
            data: priceData,
            orderId
          }, '*');
        }
      });
    };

    // Fetch the order and HTML snippet
    console.log('[Qliro Checkout] Fetching order data for orderId:', orderId);
    fetch(`/api/payments/qliro/get-order?orderId=${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        console.log('[Qliro Checkout] Get-order response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log('[Qliro Checkout] Get-order error:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (debugEnabled) {
          console.log('[Qliro] Order data received:', data);
        }
        
        if (data.htmlSnippet) {
          setHtmlSnippet(data.htmlSnippet);
        } else {
          throw new Error('No HTML snippet in response');
        }
      })
      .catch((err) => {
        console.error('[Qliro] Failed to fetch order:', err);
        
        // Try to get the checkout URL from the old way if we have it
        const urlParams = new URLSearchParams(window.location.search);
        const fallbackUrl = urlParams.get('url');
        
        if (fallbackUrl) {
          console.log('[Qliro] Falling back to iframe with URL:', fallbackUrl);
          setError('Loading checkout with iframe fallback...');
          
          // Create iframe fallback
          const iframe = document.createElement('iframe');
          iframe.src = fallbackUrl;
          iframe.style.width = '100%';
          iframe.style.height = '100vh';
          iframe.style.border = 'none';
          iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation';
          
          // Replace the error content with iframe
          setTimeout(() => {
            document.body.innerHTML = '';
            document.body.appendChild(iframe);
          }, 1000);
        } else {
          setError(err.message || 'Failed to load checkout');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, debugEnabled]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <p>Loading Qliro checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        color: '#d32f2f'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Checkout Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        width: '100%', 
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }}
      dangerouslySetInnerHTML={{ __html: htmlSnippet }}
    />
  );
}

export default function QliroCheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <QliroCheckoutContent />
    </Suspense>
  );
}