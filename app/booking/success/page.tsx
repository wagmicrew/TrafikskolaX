'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, CreditCard, Mail, User, Phone, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface BookingDetails {
  id: string
  lessonType: string
  date: string
  time: string
  duration: number
  price: number
  paymentMethod: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  status: string
}

export default function BookingSuccessPage() {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Try to get booking details from URL params or localStorage
    const bookingId = searchParams.get('bookingId')
    
    if (bookingId) {
      fetchBookingDetails(bookingId)
    } else {
      // Check localStorage for recent booking data
      const storedBooking = localStorage.getItem('recentBooking')
      if (storedBooking) {
        setBookingDetails(JSON.parse(storedBooking))
        setLoading(false)
        // Clear the stored booking data
        localStorage.removeItem('recentBooking')
      } else {
        setLoading(false)
      }
    }
  }, [searchParams])

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/booking/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBookingDetails(data)
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'swish': return 'Swish'
      case 'qliro': return 'Qliro'
      case 'credits': return 'Krediter'
      case 'pay_at_location': return 'Betala på plats'
      case 'already_paid': return 'Redan betald'
      default: return method
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bokning bekräftad!
          </h1>
          <p className="text-xl text-gray-600">
            Din körlektion har bokats framgångsrikt
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-8 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Bokningsinformation
            </h2>
            
            {bookingDetails ? (
              <div className="space-y-6">
                {/* Lesson Information */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Lektionsinformation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Lektionstyp</p>
                      <p className="font-medium">{bookingDetails.lessonType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Datum</p>
                      <p className="font-medium">{formatDate(bookingDetails.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tid</p>
                      <p className="font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {bookingDetails.time} ({bookingDetails.duration} min)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pris</p>
                      <p className="font-medium text-lg">{bookingDetails.price} SEK</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Betalningsinformation
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Betalningsmetod:</span>
                    <span className="font-medium">{getPaymentMethodLabel(bookingDetails.paymentMethod)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {bookingDetails.status === 'confirmed' ? 'Bekräftad' : 
                       bookingDetails.status === 'pending' ? 'Väntande' : 
                       bookingDetails.status}
                    </span>
                  </div>
                </div>

                {/* Customer Information */}
                {(bookingDetails.customerName || bookingDetails.customerEmail) && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-gray-600" />
                      Kontaktinformation
                    </h3>
                    <div className="space-y-2">
                      {bookingDetails.customerName && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{bookingDetails.customerName}</span>
                        </div>
                      )}
                      {bookingDetails.customerEmail && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{bookingDetails.customerEmail}</span>
                        </div>
                      )}
                      {bookingDetails.customerPhone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{bookingDetails.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking ID */}
                <div className="text-center text-sm text-gray-500">
                  Boknings-ID: {bookingDetails.id}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">
                  Din bokning har bekräftats!
                </p>
                <p className="text-gray-500">
                  Du kommer att få en bekräftelse via e-post inom kort.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nästa steg</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Bekräftelse via e-post</p>
                  <p className="text-sm text-gray-600">Du kommer att få en detaljerad bekräftelse skickad till din e-post inom några minuter.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Förbered dig inför lektionen</p>
                  <p className="text-sm text-gray-600">Var på plats i god tid (ca 10 minuter innan) och ta med giltig legitimation. Körkort är inte nödvändigt för att påbörja din utbildning.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Kontakta oss vid frågor</p>
                  <p className="text-sm text-gray-600">Om du behöver ändra eller avboka din lektion, kontakta oss så snart som möjligt.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
          <Link href="/">
            <Button className="flex items-center justify-center w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Till startsidan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
