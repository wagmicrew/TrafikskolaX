"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, DollarSign, User } from 'lucide-react'
import { SwishQR } from '@/components/SwishQR'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { toast } from 'sonner'

interface BookingData {
  id?: string
  lessonType: {
    id: string
    name: string
    type: string
  }
  scheduledDate: string
  startTime: string
  endTime: string
  totalPrice: string
  selectedUserId?: string
  selectedUserName?: string
}

interface UserCredits {
  available: number
  canUse: boolean
}

interface SiteSettings {
  contact?: {
    phone?: string
  }
  swish_phone?: string
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const { settings } = useSiteSettings()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [userCredits, setUserCredits] = useState<UserCredits>({ available: 0, canUse: false })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('swish') // Default to Swish
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [showQliroPopup, setShowQliroPopup] = useState(false)

  // Handle Qliro payment in popup
  const handleQliroPayment = async () => {
    if (!bookingId) return

    setIsProcessing(true)
    try {
      // Simulate Qliro payment process
      // In real implementation, this would integrate with Qliro API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing

      // Mark payment as completed
      const response = await fetch('/api/booking/confirm-swish-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId,
          paymentMethod: 'qliro'
        }),
      })

      if (response.ok) {
        toast.success('Bokning betald med kort!')
        setShowQliroPopup(false)
        router.push('/dashboard')
      } else {
        throw new Error('Failed to process payment')
      }
    } catch (error) {
      console.error('Qliro payment error:', error)
      toast.error('Betalningen misslyckades. Försök igen.')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    // Get booking data from URL params or sessionStorage
    const bookingParam = searchParams.get('booking')
    if (bookingParam) {
      try {
        const data = JSON.parse(decodeURIComponent(bookingParam))
        setBookingData(data)
      } catch (error) {
        console.error('Error parsing booking data:', error)
        // Fallback to sessionStorage
        const storedBooking = sessionStorage.getItem('pendingBooking')
        if (storedBooking) {
          setBookingData(JSON.parse(storedBooking))
        }
      }
    } else {
      // Fallback to sessionStorage
      const storedBooking = sessionStorage.getItem('pendingBooking')
      if (storedBooking) {
        setBookingData(JSON.parse(storedBooking))
      }
    }

    // Fetch user credits if user is logged in
    if (user) {
      fetchUserCredits()
    }
  }, [searchParams, user])

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setUserCredits({
          available: data.availableCredits || 0,
          canUse: data.availableCredits >= parseInt(bookingData?.totalPrice || '0')
        })
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method)
  }

  const handleCreateBooking = async () => {
    if (!bookingData) return

    setIsProcessing(true)
    try {
      const bookingResponse = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          paymentMethod: 'swish',
          paymentStatus: 'pending'
        }),
      })

      if (!bookingResponse.ok) {
        throw new Error('Failed to create booking')
      }

      const bookingResult = await bookingResponse.json()
      setBookingId(bookingResult.bookingId)
      toast.success('Bokning skapad! Slutför betalningen nedan.')
    } catch (error) {
      console.error('Booking creation error:', error)
      toast.error('Ett fel uppstod. Försök igen.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentComplete = async (method: string) => {
    if (!bookingId) {
      toast.error('Skapa bokning först')
      return
    }

    setIsProcessing(true)
    try {
      if (method === 'swish-paid') {
        // Mark Swish payment as completed
        const response = await fetch('/api/booking/confirm-swish-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingId
          }),
        })

        if (response.ok) {
          toast.success('Bokning betald med Swish!')
          router.push('/dashboard')
        } else {
          throw new Error('Failed to confirm payment')
        }
      } else if (method === 'qliro') {
        setShowQliroPopup(true)
        // Qliro popup will handle the payment
      } else if (method === 'credits') {
        // Deduct credits and mark as paid
        const creditResponse = await fetch('/api/user/credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingId,
            amount: parseInt(bookingData?.totalPrice || '0'),
            type: 'deduct'
          }),
        })

        if (creditResponse.ok) {
          toast.success('Bokning betald med krediter!')
          router.push('/dashboard')
        } else {
          throw new Error('Failed to deduct credits')
        }
      } else if (method === 'admin-paid') {
        // Admin marked as paid
        toast.success('Bokning markerad som betald!')
        router.push('/dashboard/admin')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Ett fel uppstod vid betalning. Försök igen.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar betalning...</p>
        </div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingen bokning hittades</h2>
          <Button onClick={() => router.push('/boka-korning')}>
            Tillbaka till bokning
          </Button>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'teacher'
  const canUseCredits = userCredits.canUse && userCredits.available >= parseInt(bookingData.totalPrice)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Slutför betalning</h1>
            <p className="text-gray-600">Skapa din bokning och välj betalningsmetod</p>
          </div>

          {/* Booking Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Bokningsöversikt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Lektion</h3>
                  <p className="text-gray-700">{bookingData.lessonType.name}</p>
                  <Badge variant="secondary" className="mt-2">
                    {bookingData.lessonType.type === 'teori' ? 'Teori' : 'Körlektion'}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Datum & Tid</h3>
                  <p className="text-gray-700">
                    {new Date(bookingData.scheduledDate).toLocaleDateString('sv-SE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-700">{bookingData.startTime} - {bookingData.endTime}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Pris</h3>
                  <p className="text-2xl font-bold text-green-600">{bookingData.totalPrice} kr</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bokad för</h3>
                  <p className="text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {bookingData.selectedUserName || user?.name || 'Du'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Booking Button */}
          {!bookingId && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Steg 1: Skapa bokning</h2>
                  <p className="text-gray-600 mb-6">
                    Klicka på knappen nedan för att skapa din bokning och få en QR-kod för betalning
                  </p>
                  <Button
                    onClick={handleCreateBooking}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  >
                    {isProcessing ? 'Skapar bokning...' : 'Skapa bokning och visa QR-kod'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Section - Only show after booking is created */}
          {bookingId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Swish QR Code - Always visible after booking creation */}
              <Card className="ring-2 ring-blue-500 border-blue-500">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Swish Betalning</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Öppna Swish-appen och scanna QR-koden nedan
                    </p>

                    {/* Swish QR Code */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 border-2 border-blue-200">
                      <SwishQR
                        phoneNumber={settings?.swish_phone || settings?.contact?.phone || "0760389192"}
                        amount={bookingData?.totalPrice || "0"}
                        message={`Faktura ${bookingId} - ${bookingData?.lessonType.name}`}
                      />
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      Faktura ID: {bookingId}
                    </div>

                    {/* Payment Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => handlePaymentComplete('swish-paid')}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isProcessing ? 'Bearbetar...' : 'Jag har betalat'}
                      </Button>

                      <Button
                        onClick={() => handlePaymentMethodSelect('qliro')}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Betala med kort istället
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      QR-koden innehåller fakturauppgifter och belopp
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Payment Methods */}
              <div className="space-y-4">

                {/* Credits Payment (if available) */}
                {canUseCredits && (
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Använd krediter</h3>
                            <p className="text-sm text-gray-600">
                              {userCredits.available} kr tillgängliga
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handlePaymentComplete('credits')}
                          disabled={isProcessing}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? 'Bearbetar...' : 'Använd krediter'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin: Mark as Paid */}
                {isAdmin && (
                  <Card className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                            <CheckCircle className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Markera som betald</h3>
                            <p className="text-sm text-gray-600">Admin: Markera bokningen som betald</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handlePaymentComplete('admin-paid')}
                          disabled={isProcessing}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {isProcessing ? 'Bearbetar...' : 'Markera betald'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Help Section */}
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Behöver du hjälp?</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Kontakta oss om du har frågor om betalningen
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = 'tel:0760389192'}
                      className="w-full"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Ring oss: 0760-389192
                    </Button>
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/boka-korning')}
              className="inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka till bokning
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
