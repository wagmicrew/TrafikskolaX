"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Smartphone, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import QRCode from "qrcode"

interface SwishPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id?: string
    totalPrice: number
  }
  bookingData?: any // Full booking data for creating the booking
  onConfirm: () => void
}

export function SwishPaymentDialog({ 
  isOpen, 
  onClose, 
  booking,
  bookingData,
  onConfirm 
}: SwishPaymentDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isPaying, setIsPaying] = useState(false)
  const { toast } = useToast()

  const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || "1234567890"
  const amount = booking.totalPrice
  const message = `Körlektion ${booking.id ? booking.id.slice(0, 8) : 'temp'}`

  useEffect(() => {
    if (isOpen) {
      generateQRCode()
    }
  }, [isOpen])

  const generateQRCode = async () => {
    try {
      // Prepare request payload for official Swish QR API
      const requestPayload = {
        payee: swishNumber.replace(/\s/g, ''),
        amount: amount.toString(),
        message: message,
        format: 'png',
        size: 256,
        transparent: false,
        border: 2
      };
      
      // Call our API endpoint to generate QR code using official Swish API
      const response = await fetch('/api/payments/swish/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
      
      if (response.ok) {
        // Get the image blob and create object URL
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setQrCodeUrl(objectUrl);
      } else {
        throw new Error('Failed to generate QR code from API');
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      
      // Fallback to local generation
      try {
        const swishData = {
          version: 1,
          payee: {
            value: swishNumber.replace(/\s/g, ''),
            editable: false
          },
          amount: {
            value: amount,
            editable: false
          },
          message: {
            value: message,
            editable: false
          }
        };

        const swishUrl = `swish://payment?data=${encodeURIComponent(JSON.stringify(swishData))}`;
        const qrUrl = await QRCode.toDataURL(swishUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (fallbackError) {
        console.error("Fallback QR generation also failed:", fallbackError);
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Kopierat!",
      description: "Text kopierad till urklipp",
    })
  }

  const handlePaymentConfirm = async () => {
    setIsPaying(true)
    try {
      // If we have booking data, update the existing temporary booking
      if (bookingData) {
        // Update the existing temporary booking with final payment method and guest info
        const updateResponse = await fetch('/api/booking/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            sessionType: bookingData.lessonType?.type || 'lesson',
            paymentMethod: 'swish',
            guestName: bookingData.guestName,
            guestEmail: bookingData.guestEmail,
            guestPhone: bookingData.guestPhone,
            studentId: bookingData.studentId,
            alreadyPaid: false
          })
        })

        if (updateResponse.ok) {
          const result = await updateResponse.json()
          // Store booking details for success page
          localStorage.setItem('recentBooking', JSON.stringify({
            id: booking.id,
            lessonType: bookingData.lessonType?.name,
            date: bookingData.selectedDate?.toISOString().split('T')[0],
            time: bookingData.selectedTime,
            duration: bookingData.lessonType?.durationMinutes,
            price: bookingData.totalPrice,
            paymentMethod: 'swish',
            status: 'pending'
          }))
          
          toast({
            title: "Bokning uppdaterad",
            description: "Din bokning har uppdaterats och väntar på betalningsbekräftelse",
          })
          onConfirm()
        } else {
          const error = await updateResponse.json()
          throw new Error(error.error || 'Failed to update booking')
        }
      } else {
        try {
          // Confirm existing temporary booking
          const response = await fetch('/api/booking/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bookingId: booking.id || 'temp',
              sessionType: 'lesson', // Default to lesson for backward compatibility
              paymentMethod: 'swish'
            }),
          })
  
          if (response.ok) {
            toast({
              title: "Betalning registrerad",
              description: "Vi kommer att bekräfta din betalning inom kort",
            })
            // Email sending will be handled by the API
            onConfirm()
          } else {
            // Check for specific error
            const errorData = await response.json();
            if (errorData.error === 'Email already exists') {
              // Handle email conflict - could show a dialog or redirect
              console.warn('Email already exists for booking');
            } else {
              throw new Error(errorData.error || 'Failed to confirm payment')
            }
          }
        } catch(error) {
          toast({
            title: "Fel",
            description: error instanceof Error ? error.message : "Något gick fel. Försök igen.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Något gick fel. Försök igen.",
        variant: "destructive",
      })
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[500px] md:max-w-[600px] max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Swish betalning</DialogTitle>
          <DialogDescription>Betala din körlektion med Swish genom att scanna QR-koden eller ange betalningsinformation manuellt</DialogDescription>
        </DialogHeader>
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-xl sm:rounded-2xl"></div>
          
          <div className="relative z-10 h-full overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {/* Header */}
              <div className="relative mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-400/30">
                      <Smartphone className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">
                      Betala med Swish
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group"
                    aria-label="Stäng"
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
                <div className="text-sm text-white/70">
                  {message}
                </div>
                <div className="text-xs text-white/60 mt-2">
                  Boknings-ID: {booking.id || 'Genereras...'}
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Scanna QR-koden med Swish-appen
                  </h3>
                  <p className="text-sm text-gray-600">
                    Öppna Swish-appen och välj "Scanna QR-kod"
                  </p>
                </div>
                
                <div className="flex justify-center mb-4">
                  {qrCodeUrl ? (
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <img 
                        src={qrCodeUrl} 
                        alt="Swish QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Payment Info */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-6">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Eller betala manuellt:
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Swish-nummer:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{swishNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(swishNumber)}
                        className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Belopp:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{amount}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(amount.toString())}
                        className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Meddelande:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white text-xs">{message}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(message)}
                        className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handlePaymentConfirm}
                disabled={isPaying}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Bekräftar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Jag har betalat
                  </>
                )}
              </Button>

              <p className="text-xs text-white/60 text-center mt-4">
                När du klickar "Jag har betalat" kommer vi att verifiera din betalning
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
