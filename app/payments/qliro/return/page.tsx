"use client";

import { useEffect, useMemo, useState } from "react";

export default function QliroReturnPage() {
  const [message, setMessage] = useState("Bearbetar din betalning...");
  const search = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const purchase = search.get('purchase') || '';

  useEffect(() => {
    // Inform opener and close self immediately
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'qliro:completed',
          purchaseId: purchase,
          location: window.location.href,
        }, '*');
      }
    } catch {}
    try { window.close(); } catch {}
    const timer = setTimeout(() => setMessage('Du kan nu stänga detta fönster.'), 600);
    return () => clearTimeout(timer);
  }, [purchase]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow p-6 text-center max-w-md">
        <h1 className="text-xl font-semibold mb-2">Tack!</h1>
        <p className="text-gray-600">{message}</p>
        {purchase && (
          <p className="text-xs text-gray-400 mt-2">Köp-ID: {purchase}</p>
        )}
      </div>
    </main>
  );
}


