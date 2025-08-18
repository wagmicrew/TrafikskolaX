/**
 * Qliro Flow Manager - Handles different checkout flow types
 * Based on Qliro documentation: https://developers.qliro.com/docs/qliro-checkout/get-started/load-checkout
 */

import { QliroModernPopup } from '@/components/payments/qliro-modern-popup';

export type QliroFlowType = 'window' | 'popup';

export interface QliroCheckoutOptions {
  orderId: string;
  amount: number;
  description: string;
  checkoutUrl?: string;
  onCompleted?: () => void;
  onError?: (error: any) => void;
}

export class QliroFlowManager {
  private static settings: { qliro_checkout_flow: string } | null = null;
  private static lastSettingsLoad: number = 0;
  private static CACHE_DURATION = 30 * 1000; // 30 seconds cache

  static async getFlowType(): Promise<QliroFlowType> {
    const now = Date.now();
    
    // Refresh settings if cache is expired or not loaded
    if (!this.settings || (now - this.lastSettingsLoad) > this.CACHE_DURATION) {
      try {
        console.log('[QliroFlowManager] Loading fresh settings...');
        const response = await fetch('/api/public/site-settings');
        if (response.ok) {
          this.settings = await response.json();
          this.lastSettingsLoad = now;
          console.log('[QliroFlowManager] Settings loaded:', { 
            qliro_checkout_flow: this.settings?.qliro_checkout_flow || 'not set' 
          });
        }
      } catch (error) {
        console.warn('[QliroFlowManager] Could not load settings, using default window flow', error);
      }
    }
    
    const flowType = this.settings?.qliro_checkout_flow || 'window';
    const selectedFlow: QliroFlowType = flowType === 'popup' ? 'popup' : 'window';
    
    console.log('[QliroFlowManager] Using flow type:', selectedFlow);
    return selectedFlow;
  }

  static async openQliroCheckout(options: QliroCheckoutOptions): Promise<void> {
    const flowType = await this.getFlowType();
    
    console.log('[QliroFlowManager] Opening Qliro checkout with flow type:', flowType);
    
    if (flowType === 'popup') {
      return this.openPopupFlow(options);
    } else {
      return this.openWindowFlow(options);
    }
  }

  private static openPopupFlow(options: QliroCheckoutOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create popup container if it doesn't exist
        let popupContainer = document.getElementById('qliro-popup-container');
        if (!popupContainer) {
          popupContainer = document.createElement('div');
          popupContainer.id = 'qliro-popup-container';
          document.body.appendChild(popupContainer);
        }

        // Import and render the popup component
        Promise.all([
          import('react'),
          import('react-dom/client'),
          import('@/components/payments/qliro-modern-popup')
        ]).then(([React, ReactDOM, { QliroModernPopup }]) => {
          const root = ReactDOM.createRoot(popupContainer!);
          
          const closePopup = () => {
            try {
              root.unmount();
              popupContainer?.remove();
              resolve();
            } catch (e) {
              console.warn('[QliroFlowManager] Error cleaning up popup:', e);
              resolve();
            }
          };

          const PopupComponent = React.createElement(QliroModernPopup, {
            isOpen: true,
            onClose: closePopup,
            orderId: options.orderId,
            amount: options.amount,
            description: options.description,
            onCompleted: () => {
              console.log('[QliroFlowManager] Popup flow completed');
              options.onCompleted?.();
              closePopup();
            },
            onError: (error) => {
              console.error('[QliroFlowManager] Popup flow error:', error);
              options.onError?.(error);
              reject(error);
            }
          });

          root.render(PopupComponent);
          
        }).catch(error => {
          console.error('[QliroFlowManager] Failed to load popup components:', error);
          // Fallback to window flow if popup fails
          this.openWindowFlow(options).then(resolve).catch(reject);
        });
        
      } catch (error) {
        console.error('[QliroFlowManager] Error initializing popup flow:', error);
        // Fallback to window flow if popup fails
        this.openWindowFlow(options).then(resolve).catch(reject);
      }
    });
  }

  private static openWindowFlow(options: QliroCheckoutOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { orderId, checkoutUrl } = options;
        
        // Calculate window dimensions and position
        const width = Math.min(520, Math.floor(window.innerWidth * 0.9));
        const height = Math.min(860, Math.floor(window.innerHeight * 0.95));
        const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
        const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
        const features = `popup=yes,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
        
        // Prefer server-rendered raw route to avoid any inline script/CSP issues
        const url = checkoutUrl || `/payments/qliro/raw?orderId=${encodeURIComponent(orderId)}`;
        const win = window.open(url, 'qliro_window', features);
        
        if (!win) {
          throw new Error('Popup blocker prevented opening Qliro window');
        }
        
        // Listen for completion message from popup
        const messageListener = (event: MessageEvent) => {
          const data = event.data || {};
          if (data?.type === 'qliro:completed' || data?.event === 'payment_completed') {
            window.removeEventListener('message', messageListener);
            options.onCompleted?.();
            resolve();
          } else if (data?.type === 'qliro:error') {
            window.removeEventListener('message', messageListener);
            const error = new Error(data.message || 'Payment error');
            options.onError?.(error);
            reject(error);
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Handle window close
        const checkClosed = setInterval(() => {
          if (win.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            resolve(); // Consider window close as completion (user may have finished payment)
          }
        }, 1000);
        
      } catch (error) {
        options.onError?.(error);
        reject(error);
      }
    });
  }

  /**
   * Legacy support for existing openQliroPopup function
   */
  static async openQliroPopup(orderId: string, title = 'qliro_window'): Promise<void> {
    return this.openQliroCheckout({
      orderId,
      amount: 0, // Will be fetched from order
      description: 'Betalning'
    });
  }
}
