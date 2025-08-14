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
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    // Define q1Ready globally before fetching the order
    (window as any).q1Ready = function() {
      const q1 = (window as any).q1;
      if (!q1) {
        if (debugEnabled) console.log('[Qliro] q1Ready called but q1 not available');
        return;
      }

      if (debugEnabled) {
        console.log('[Qliro] q1Ready - Checkout loaded, setting up listeners');
      }

      // Setup all q1 event listeners as per Qliro documentation
      const events = [
        'onCheckoutLoaded',
        'onCustomerInfoChanged', 
        'onOrderUpdated',
        'onCustomerDeauthenticating',
        'onPaymentMethodChanged',
        'onPaymentDeclined',
        'onPaymentProcess',
        'onSessionExpired',
        'onShippingMethodChanged',
        'onShippingPriceChanged'
      ];

      events.forEach(eventName => {
        if (typeof q1[eventName] === 'function') {
          q1[eventName]((data: any) => {
            if (debugEnabled) {
              console.log(`[Qliro] ${eventName}:`, data);
            }
            
            // Send to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: `qliro:${eventName}`,
                data,
                orderId
              }, '*');
            }
          });
        }
      });

      // Special handling for payment completion
      if (typeof q1.onPaymentProcess === 'function') {
        q1.onPaymentProcess((data: any) => {
          if (debugEnabled) {
            console.log('[Qliro] Payment process:', data);
          }
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'qliro:onPaymentProcess',
              data,
              orderId
            }, '*');
          }
        });
      }
    };

    // Fetch the order and HTML snippet
    fetch(`/api/payments/qliro/get-order?orderId=${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
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
        setError(err.message || 'Failed to load checkout');
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