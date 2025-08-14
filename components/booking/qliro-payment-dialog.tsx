"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, CreditCard, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QliroPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: string
  amount: number
  checkoutUrl: string
  onConfirm: () => void
}

export function QliroPaymentDialog({ 
  isOpen, 
  onClose, 
  purchaseId,
  amount,
  checkoutUrl,
  onConfirm 
}: QliroPaymentDialogProps) {
  const [isPaying, setIsPaying] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const allowedOrigin = useMemo(() => {
    try { return new URL(checkoutUrl).origin } catch { return '*' }
  }, [checkoutUrl])
  const { toast } = useToast()
  const [extendedDebug, setExtendedDebug] = useState(false)
  
  useEffect(() => {
    // Fetch public debug flag
    fetch('/api/public/site-settings')
      .then(r => r.ok ? r.json() : Promise.resolve({}))
      .then(data => setExtendedDebug(Boolean(data.debug_extended_logs)))
      .catch(() => setExtendedDebug(false))
  }, [])
  
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (allowedOrigin !== '*' && event.origin !== allowedOrigin) return;
      const data = event.data || {};
      if (extendedDebug) {
        console.debug('[QliroListener] message', { origin: event.origin, data })
      }
      if (data && (data.type === 'qliro:completed' || data.event === 'payment_completed' || data.event === 'CheckoutCompleted' || data.status === 'Paid' || data.status === 'Completed')) {
        try {
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
        } catch {}
        try {
          if (extendedDebug) console.debug('[QliroListener] detected completion, purchaseId:', purchaseId)
          // If this is a package purchase (UUID), finalize immediately via API
          const isPackage = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(purchaseId)
          if (isPackage) {
            fetch('/api/packages/purchase', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ purchaseId, status: 'completed', paymentMethod: 'qliro' })
            }).then(async (res) => {
              if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                if (extendedDebug) console.error('[QliroListener] finalize package failed', j)
                toast({ title: 'Fel vid bekräftelse', description: 'Kunde inte slutföra paketköpet. Kontakta support om belopp dragits.', variant: 'destructive' as any })
              }
              // Navigate to thank-you
              try { window.location.href = '/booking/success?package=1' } catch {}
            }).catch(() => {
              if (extendedDebug) console.error('[QliroListener] finalize package network error')
              toast({ title: 'Fel vid bekräftelse', description: 'Kunde inte slutföra paketköpet. Kontakta support om belopp dragits.', variant: 'destructive' as any })
            })
          } else if (purchaseId && purchaseId.startsWith('booking_')) {
            // For bookings, route through return endpoint to mark paid and redirect to thank-you
            try { window.location.href = `/qliro/return?ref=${encodeURIComponent(purchaseId)}&status=paid` } catch {}
          } else {
            onConfirm();
          }
        } catch {
          onConfirm();
        }
      }
    }
    if (extendedDebug) console.debug('[QliroListener] attaching listener for', allowedOrigin)
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConfirm, allowedOrigin, purchaseId, extendedDebug])

  const handlePaymentConfirm = async () => {
    setIsPaying(true)
    try {
      // No redirect; iframe will render the checkout below
      toast({
        title: "Qliro checkout",
        description: "Vi väntar på betalningsbekräftelse...",
      })
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-[1200px] max-h-[95vh] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Qliro Payment</DialogTitle>
          <DialogDescription>Pay your amount via Qliro by visiting the checkout page.</DialogDescription>
        </DialogHeader>
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-xl sm:rounded-2xl"></div>
          <div className="relative z-10 h-full overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {/* Header */}
              <div className="relative mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-600/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-400/30">
                      <CreditCard className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">
                      Pay with Qliro
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4"></div>
              </div>

              {/* Amount */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                  {amount} SEK
                </div>
                <div className="text-xs text-white/60 mt-2">
                  Purchase ID: {purchaseId}
                </div>
              </div>

              {/* Embedded Checkout page to avoid third-party headers directly */}
              <div className="mt-4 rounded-lg overflow-hidden border border-white/20 bg-black/20">
                <div className="relative pb-[175%] sm:pb-[110%] md:pb-[80%] lg:pb-[70%] xl:pb-[65%]">
                  <iframe
                    src={`/payments/qliro/checkout?url=${encodeURIComponent(checkoutUrl)}`}
                    title="Qliro Checkout"
                    className="absolute inset-0 w-full h-full"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    allow="payment *; clipboard-write;"
                  />
                </div>
              </div>

              {/* Fallback/open button */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    try {
                      const width = Math.min(480, Math.floor(window.innerWidth * 0.8));
                      const height = Math.min(780, Math.floor(window.innerHeight * 0.9));
                      const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
                      const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
                      const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
                       (async () => {
                         try {
                           const { openQliroPopup } = await import('@/lib/payment/qliro-popup')
                           // try to parse orderId from returnUrl or known context is not available here, fallback to iframe window
                           const m = /[?&]orderId=([^&#]+)/.exec(checkoutUrl)
                           if (m && m[1]) { await openQliroPopup(decodeURIComponent(m[1])); return }
                         } catch {}
                         const safeUrl = `/payments/qliro/checkout?url=${encodeURIComponent(checkoutUrl)}`
                         const win = window.open(safeUrl, 'qliro_window', features);
                         if (!win) return;
                         popupRef.current = win;
                         win.focus();
                       })();
                    } catch {}
                  }}
                >
                  Betala i litet fönster
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Jag är klar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

