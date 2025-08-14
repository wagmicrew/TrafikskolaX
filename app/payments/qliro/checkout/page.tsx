"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function QliroEmbedPage({ searchParams }: { searchParams: { url?: string, orderId?: string } }) {
  const [extendedDebug, setExtendedDebug] = useState(false)
  const orderId = searchParams?.orderId || ''
  const targetUrl = useMemo(() => {
    try {
      const u = decodeURIComponent(searchParams.url || '')
      // Basic allowlist: must be https and contain qliro.com
      const parsed = new URL(u)
      if (parsed.protocol !== 'https:') return ''
      if (!/\.qliro\.com$/i.test(parsed.hostname) && !/qliro\.com$/i.test(parsed.hostname)) return ''
      return parsed.toString()
    } catch { return '' }
  }, [searchParams?.url])

  useEffect(() => {
    fetch('/api/public/site-settings')
      .then(r => r.ok ? r.json() : Promise.resolve({}))
      .then(s => setExtendedDebug(Boolean(s?.debug_extended_logs)))
      .catch(() => setExtendedDebug(false))
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data || {}
      if (extendedDebug) {
        // eslint-disable-next-line no-console
        console.debug('[QliroEmbed] message', { origin: event.origin, data })
      }
      if (data?.event === 'CheckoutLoaded') {
        try { window.opener?.postMessage({ event: 'CheckoutLoaded' }, '*') } catch {}
      }
      if (data?.event === 'PaymentMethodChanged') {
        try { window.opener?.postMessage({ event: 'PaymentMethodChanged', pm: data.pm }, '*') } catch {}
      }
      if (data && (data.type === 'qliro:completed' || data.event === 'payment_completed' || data.event === 'CheckoutCompleted' || data.status === 'Paid' || data.status === 'Completed')) {
        try { window.opener?.postMessage({ type: 'qliro:completed' }, '*') } catch {}
        try { window.close() } catch {}
      }
      if (data && (data.type === 'qliro:declined' || data.event === 'payment_declined' || data.status === 'Declined')) {
        try { window.opener?.postMessage({ type: 'qliro:declined', reason: data.reason, message: data.message }, '*') } catch {}
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [extendedDebug])

  useEffect(() => {
    // If orderId present, fetch PaymentOptions once and log non-Swish methods
    (async () => {
      if (!orderId) return
      try {
        const res = await fetch('/api/admin/qliro/payment-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) })
        const data = await res.json()
        if (res.ok) {
          const candidates: string[] = []
          const scan = (obj: any) => {
            if (!obj) return
            if (Array.isArray(obj)) { for (const it of obj) scan(it); return }
            if (typeof obj === 'object') {
              const name = String(obj.Name || obj.Method || obj.GroupName || '').toLowerCase()
              const id = obj.PaymentId || obj.Id || obj.PaymentID || null
              if (id && name && !name.includes('swish')) candidates.push(String(id))
              for (const k of Object.keys(obj)) scan(obj[k])
            }
          }
          scan(data.options)
          if (extendedDebug) console.debug('[QliroEmbed] PaymentOptions (non-swish ids)', candidates)
        } else if (extendedDebug) {
          console.debug('[QliroEmbed] PaymentOptions error', data)
        }
      } catch (e) {
        if (extendedDebug) console.debug('[QliroEmbed] PaymentOptions fetch failed', e)
      }
    })()
  }, [orderId, extendedDebug])

  useEffect(() => {
    if (extendedDebug) {
      // eslint-disable-next-line no-console
      console.debug('[QliroEmbed] targetUrl', targetUrl)
    }
  }, [extendedDebug, targetUrl])

  if (!targetUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-lg font-semibold mb-2">Ogiltig betalningslänk</div>
          <div className="text-sm text-gray-500">Kunde inte öppna Qliro. Stäng fönstret och försök igen.</div>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src={targetUrl}
      title="Qliro Checkout"
      className="w-screen h-screen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      allow="payment *; clipboard-write;"
    />
  )
}


