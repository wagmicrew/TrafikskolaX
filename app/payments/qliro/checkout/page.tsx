"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function QliroEmbedPage({ searchParams }: { searchParams: { url?: string } }) {
  const [extendedDebug, setExtendedDebug] = useState(false)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-2">
        <div className="relative pb-[175%] sm:pb-[110%] md:pb-[80%] lg:pb-[70%] xl:pb-[65%]">
          <iframe
            src={targetUrl}
            title="Qliro Checkout"
            className="absolute inset-0 w-full h-full rounded-lg border"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allow="payment *; clipboard-write;"
          />
        </div>
      </div>
    </div>
  )
}


