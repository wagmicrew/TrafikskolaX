"use client";

import { useEffect, useMemo, useState } from 'react'

export default function ThankYouPage() {
  const [extendedDebug, setExtendedDebug] = useState(false)
  const search = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), [])
  const ref = search.get('ref') || ''
  const status = (search.get('status') || '').toLowerCase()

  useEffect(() => {
    fetch('/api/public/site-settings')
      .then(r => r.ok ? r.json() : Promise.resolve({}))
      .then(s => setExtendedDebug(Boolean(s?.debug_extended_logs)))
      .catch(() => setExtendedDebug(false))
  }, [])

  useEffect(() => {
    // Tell opener we arrived
    try { window.opener?.postMessage({ type: 'qliro:return', ref, status }, '*') } catch {}
    if (extendedDebug) {
      // eslint-disable-next-line no-console
      console.debug('[QliroThankYou] ref/status', { ref, status })
    }
  }, [extendedDebug, ref, status])

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-3">Tack!</h1>
        <p className="text-gray-600 mb-6">
          Din Qliro-betalning har slutförts.
          <br />
          Du kan nu stänga detta fönster.
        </p>
        {status && (
          <div className="text-xs text-gray-500">Status: {status}</div>
        )}
      </div>
    </main>
  )
}


