"use client"

import { useEffect, useState } from 'react'

type QliroListenerOptions = {
  onCompleted?: () => void
  onDeclined?: (reason?: string, message?: string) => void
  onLoaded?: () => void
  onMethodChanged?: (payload: any) => void
  onError?: (payload?: any) => void
}

export function useQliroListener(opts: QliroListenerOptions = {}) {
  const [extendedDebug, setExtendedDebug] = useState(false)

  useEffect(() => {
    fetch('/api/public/site-settings')
      .then(r => r.ok ? r.json() : Promise.resolve({}))
      .then(s => setExtendedDebug(Boolean(s?.debug_extended_logs)))
      .catch(() => setExtendedDebug(false))
  }, [])

  useEffect(() => {
    // Background postMessage listener (works for popup or iframe)
    const onMessage = (event: MessageEvent) => {
      const data = event.data || {}
      if (extendedDebug) console.debug('[useQliroListener] message', { origin: event.origin, data })
      
      // Handle new q1 event format
      if (data?.type?.startsWith('qliro:')) {
        const eventType = data.type.replace('qliro:', '')
        if (extendedDebug) console.debug('[useQliroListener] q1 event:', eventType, data.data)
        
        switch (eventType) {
          case 'error':
            console.error('[useQliroListener] Qliro popup error:', data.data)
            opts.onError?.(data.data)
            break
          case 'popup:boot':
          case 'q1Detected':
          case 'bootstrap':
            if (extendedDebug) console.debug('[useQliroListener] diag:', eventType, data.data)
            break
          case 'bootstrap:timeout':
            console.warn('[useQliroListener] bootstrap timeout', data.data)
            break
          case 'onCheckoutLoaded':
            opts.onLoaded?.()
            break
          case 'onPaymentMethodChanged':
            opts.onMethodChanged?.(data.data)
            break
          case 'onPaymentDeclined':
            opts.onDeclined?.(data.data?.reason, data.data?.message)
            break
          case 'onPaymentProcess':
            if (extendedDebug) console.debug('[useQliroListener] Payment processing:', data.data)
            // Check if payment is completed
            if (data.data?.status === 'Completed' || data.data?.status === 'Paid') {
              opts.onCompleted?.()
            }
            break
          case 'onPaymentProcess:start':
            if (extendedDebug) console.debug('[useQliroListener] Payment process start')
            break
          case 'onPaymentProcess:end':
            if (extendedDebug) console.debug('[useQliroListener] Payment process end:', data.data)
            if (data.data?.status === 'Completed' || data.data?.status === 'Paid') {
              opts.onCompleted?.()
            }
            break
          case 'completed':
            opts.onCompleted?.()
            break
          case 'onCustomerInfoChanged':
            if (extendedDebug) console.debug('[useQliroListener] Customer info changed:', data.data)
            break
          case 'onOrderUpdated':
            if (extendedDebug) console.debug('[useQliroListener] Order updated:', data.data)
            break
          case 'onSessionExpired':
            if (extendedDebug) console.debug('[useQliroListener] Session expired:', data.data)
            break
          case 'onCustomerDeauthenticating':
            if (extendedDebug) console.debug('[useQliroListener] Customer deauthenticating:', data.data)
            break
          case 'onShippingMethodChanged':
            if (extendedDebug) console.debug('[useQliroListener] Shipping method changed:', data.data)
            break
          case 'onShippingPriceChanged':
            if (extendedDebug) console.debug('[useQliroListener] Shipping price changed:', data.data)
            break
          default:
            if (extendedDebug) console.debug('[useQliroListener] unhandled q1 event:', eventType, data.data)
            break
        }
        // Prevent legacy fallbacks from also handling the same modern event
        return
      }
      
      // Legacy format support
      if (data?.event === 'CheckoutLoaded') {
        opts.onLoaded?.()
      }
      if (data?.event === 'PaymentMethodChanged') {
        opts.onMethodChanged?.(data.pm)
      }
      if (data?.type === 'qliro:return') {
        // Acknowledge thank-you redirect
        if (extendedDebug) console.debug('[useQliroListener] return reached', data)
      }
      if (data?.type === 'qliro:declined') {
        opts.onDeclined?.(data?.reason, data?.message)
      }
      if (data && (data.type === 'qliro:completed' || data.event === 'payment_completed' || data.event === 'CheckoutCompleted' || data.status === 'Paid' || data.status === 'Completed')) {
        opts.onCompleted?.()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [extendedDebug, opts])

  useEffect(() => {
    // q1Ready global (works only in same-window iframes). If present, set rich listeners and relay events via postMessage
    ;(window as any).q1Ready = function(q1: any) {
      try {
        if (extendedDebug) console.debug('[useQliroListener] q1Ready invoked')
        q1?.onCheckoutLoaded?.(() => {
          if (extendedDebug) console.debug('[useQliroListener] onCheckoutLoaded')
          try { window.parent?.postMessage({ event: 'CheckoutLoaded' }, '*') } catch {}
          opts.onLoaded?.()
        })
        q1?.onPaymentMethodChanged?.((pm: any) => {
          if (extendedDebug) console.debug('[useQliroListener] onPaymentMethodChanged', pm)
          try { window.parent?.postMessage({ event: 'PaymentMethodChanged', pm }, '*') } catch {}
          opts.onMethodChanged?.(pm)
        })
        q1?.onPaymentDeclined?.((reason: string, message: string) => {
          if (extendedDebug) console.debug('[useQliroListener] onPaymentDeclined', { reason, message })
          try { window.parent?.postMessage({ type: 'qliro:declined', reason, message }, '*') } catch {}
          opts.onDeclined?.(reason, message)
        })
        // Wrap payment process hooks
        q1?.onPaymentProcess?.(
          () => extendedDebug && console.debug('[useQliroListener] onPaymentProcess start'),
          () => extendedDebug && console.debug('[useQliroListener] onPaymentProcess end')
        )
      } catch (e) {
        if (extendedDebug) console.error('[useQliroListener] q1Ready error', e)
      }
    }
  }, [extendedDebug, opts])
}


