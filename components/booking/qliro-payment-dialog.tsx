"use client"

import { useState, useEffect } from "react"
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
  const { toast } = useToast()

  const handlePaymentConfirm = async () => {
    setIsPaying(true)
    try {
      // No redirect; iframe will render the checkout below
      toast({
        title: "Qliro checkout",
        description: "Fönstret är öppet här nedan.",
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

              {/* Embedded Checkout */}
              {!iframeError ? (
                <div className="mt-4 rounded-lg overflow-hidden border border-white/20 bg-black/20">
                  <iframe
                    src={checkoutUrl}
                    title="Qliro Checkout"
                    className="w-full h-[70vh]"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onError={() => setIframeError(true)}
                  />
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                  Det gick inte att bädda in Qliro-fönstret. Du kan öppna det i en ny flik nedan.
                </div>
              )}

              {/* Fallback/open button */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button onClick={handlePaymentConfirm} disabled={isPaying} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isPaying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Öppnar...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Visa här i fönstret
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}>
                  Öppna i ny flik
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

