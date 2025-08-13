"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QliroMessageBridge } from "@/components/system/QliroMessageBridge";

export default function QliroCheckoutPage() {
  const search = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const url = (search.get('url') || '').trim();
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const origin = useMemo(() => { try { return new URL(url).origin } catch { return '*' } }, [url]);

  useEffect(() => {
    if (!url) setError('Saknar checkout-url');
  }, [url]);

  function onLoad() {
    try {
      const target = iframeRef.current?.contentWindow;
      if (target) {
        target.postMessage({ action: 'subscribe', source: 'trafikskolax' }, origin === '*' ? '*' : origin);
      }
    } catch {}
  }

  return (
    <main className="min-h-[70vh] p-4 md:p-8">
      <QliroMessageBridge />
      {error ? (
        <div className="max-w-lg mx-auto bg-amber-100 text-amber-900 p-4 rounded-lg border border-amber-300">{error}</div>
      ) : (
        <div className="max-w-5xl mx-auto rounded-xl border border-gray-200 bg-white shadow">
          <div className="relative pb-[175%] sm:pb-[110%] md:pb-[80%] lg:pb-[70%] xl:pb-[65%]">
            <iframe
              ref={iframeRef}
              src={url}
              title="Qliro Checkout"
              className="absolute inset-0 w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allow="payment *; clipboard-write;"
              onLoad={onLoad}
            />
          </div>
        </div>
      )}
    </main>
  );
}


