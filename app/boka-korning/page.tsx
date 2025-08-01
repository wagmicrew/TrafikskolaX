"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { BookingSteps } from "@/components/booking/booking-steps"
import { LessonSelection } from "@/components/booking/lesson-selection"
import { TransmissionSelection } from "@/components/booking/transmission-selection"
import { WeekCalendar } from "@/components/booking/week-calendar"
import { HandledarSessionSelection } from "@/components/booking/handledar-session-selection"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { useAuth } from "@/hooks/use-auth"
import { SwishPaymentDialog } from "@/components/booking/swish-payment-dialog"
import { toast } from "react-hot-toast"

interface SessionType {
  id: string
  type: 'lesson' | 'handledar';
  name: string
  description: string | null
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  isActive: boolean
}

interface BookingData {
  sessionType: SessionType | null
  transmissionType: "manual" | "automatic" | null
  selectedDate: Date | null
  selectedTime: string | null
  totalPrice: number
  bookingId?: string
}

export default function BokaKorning() {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: null,
    transmissionType: null,
    selectedDate: null,
    selectedTime: null,
    totalPrice: 0,
  })
  const [loading, setLoading] = useState(false)
  const [showSwishDialog, setShowSwishDialog] = useState(false)
  const [userCredits, setUserCredits] = useState<any[]>([])
  const [hasAvailableHandledarCredits, setHasAvailableHandledarCredits] = useState(false)
  const [showCreditSuggestion, setShowCreditSuggestion] = useState(false)
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUserCredits()
    }
  }, [user])

  const fetchUserCredits = async () => {
    try {
      const userId = (user as any)?.id || (user as any)?.sub;
      if (!userId) return;
      
      const response = await fetch(`/api/users/${userId}/credits`)
      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.credits || [])
        
        // Check for available handledar credits
        const handledarCredits = data.credits?.filter(
          (credit: any) => credit.creditType === 'handledar' && credit.creditsRemaining > 0
        ) || []
        setHasAvailableHandledarCredits(handledarCredits.length > 0)
      }
    } catch (error) {
      console.error('Error fetching user credits:', error)
    }
  }

  const checkHandledarCreditsAndProceed = (sessionType: any) => {
    if (sessionType.type === 'handledar' && hasAvailableHandledarCredits) {
      setShowCreditSuggestion(true)
    } else {
      proceedWithBooking(sessionType)
    }
  }

  const proceedWithBooking = (sessionType: any) => {
    setBookingData((prev) => ({
      ...prev,
      sessionType,
      totalPrice: calculatePrice(sessionType, user),
    }))
    
    if (sessionType.type === 'handledar') {
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
    
    setShowCreditSuggestion(false)
  }

  const handleStepComplete = (stepData: any) => {
    switch (currentStep) {
      case 1:
        checkHandledarCreditsAndProceed(stepData.sessionType)
        break
      case 2:
        setBookingData((prev) => ({
          ...prev,
          transmissionType: stepData.transmissionType,
        }))
        setCurrentStep(3)
        break
      case 3:
        setBookingData((prev) => ({
          ...prev,
          selectedDate: stepData.selectedDate,
          selectedTime: stepData.selectedTime,
        }))
        setCurrentStep(4)
        break
      case 4:
        // Handle final booking confirmation
        handleBookingComplete(stepData)
        break
    }
  }

  const calculatePrice = (sessionType: SessionType, user: any) => {
    // Check for sale price first
    if (sessionType.salePrice) {
      return Number(sessionType.salePrice)
    }
    // Check if user is enrolled student
    if (user?.inskriven && sessionType.priceStudent) {
      return Number(sessionType.priceStudent)
    }
    return Number(sessionType.price)
  }

  const handleBookingComplete = async (paymentData: any) => {
    try {
      setLoading(true)
      
      // Create booking
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: bookingData.sessionType?.type,
          sessionId: bookingData.sessionType?.id,
          scheduledDate: bookingData.selectedDate?.toISOString().split('T')[0],
          startTime: bookingData.selectedTime,
          endTime: bookingData.sessionType!.type === 'handledar' ? 'To be confirmed' : calculateEndTime(bookingData.selectedTime!, bookingData.sessionType!.durationMinutes),
          durationMinutes: bookingData.sessionType!.durationMinutes,
          transmissionType: bookingData.transmissionType,
          totalPrice: bookingData.totalPrice,
          ...paymentData, // Guest info if not logged in
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create booking')
      }

      const data = await response.json()
      setBookingData(prev => ({ ...prev, bookingId: data.booking.id }))

      // Show payment dialog based on selected method
      if (paymentData.paymentMethod === 'swish') {
        setShowSwishDialog(true)
      } else if (paymentData.paymentMethod === 'credits') {
        // Handle credit payment
        await handleCreditPayment(data.booking.id)
      } else if (paymentData.paymentMethod === 'pay_at_location') {
        // Handle pay at location
        await handlePayAtLocation(data.booking.id)
      }
    } catch (error) {
      console.error('Error completing booking:', error)
      alert('Ett fel uppstod. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const handleCreditPayment = async (bookingId: string) => {
    // Credit payment is already handled in the booking creation
    // Just move to success step
    setCurrentStep(5)
  }

  const handlePayAtLocation = async (bookingId: string) => {
    // TODO: Implement pay at location
    setCurrentStep(5)
  }

  const handleSwishConfirm = () => {
    setShowSwishDialog(false)
    setCurrentStep(5)
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const steps = [
    { number: 1, title: "Välj lektion" },
    { number: 2, title: "Växellåda" },
    { number: 3, title: "Välj datum & tid" },
    { number: 4, title: "Bekräfta" },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar bokningssystem...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-4">Boka SESSION</h1>
          <p className="text-lg md:text-xl text-gray-600">Välj session, tid och bekräfta din bokning</p>
        </div>

        {/* Progress Steps */}
        <BookingSteps currentStep={currentStep} steps={steps} />

        {/* Main Content */}
        <div className="mt-6 md:mt-8">
          {currentStep === 1 && <LessonSelection onComplete={handleStepComplete} />}

          {currentStep === 2 && bookingData.sessionType?.type === 'lesson' && (
            <TransmissionSelection onComplete={handleStepComplete} onBack={goBack} />
          )}

          {currentStep === 3 && bookingData.sessionType && bookingData.sessionType.type === 'handledar' && (
            <HandledarSessionSelection
              sessionType={bookingData.sessionType}
              onComplete={handleStepComplete}
              onBack={goBack}
            />
          )}

          {currentStep === 3 && bookingData.sessionType && bookingData.sessionType.type === 'lesson' && (
            <WeekCalendar
              lessonType={bookingData.sessionType} // Map sessionType to lessonType for compatibility
              transmissionType={bookingData.transmissionType}
              onComplete={handleStepComplete}
              onBack={goBack}
            />
          )}

          {currentStep === 4 && bookingData.sessionType && bookingData.selectedDate && bookingData.selectedTime && (
            <BookingConfirmation
              bookingData={{
                lessonType: bookingData.sessionType, // Map sessionType to lessonType for compatibility
                transmissionType: bookingData.transmissionType,
                selectedDate: bookingData.selectedDate,
                selectedTime: bookingData.selectedTime,
                totalPrice: bookingData.totalPrice
              }}
              user={user}
              onComplete={handleStepComplete}
              onBack={goBack}
            />
          )}

          {currentStep === 5 && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Bokning bekräftad!</h2>
              <p className="text-gray-600 mb-6">Din körlektion har bokats. Du kommer få en bekräftelse via e-post.</p>
              <Button 
                onClick={() => window.location.href = user ? "/dashboard" : "/"} 
                className="bg-red-600 hover:bg-red-700"
              >
                {user ? "Gå till Min Sida" : "Gå till startsidan"}
              </Button>
            </div>
          )}
        </div>

        {/* Credit Suggestion Modal */}
        {showCreditSuggestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Du har tillgängliga handledarkurskrediter!
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Vi har upptäckt att du har handledarkurskrediter tillgängliga. Vill du använda en av dina krediter istället för att betala?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Krediter tillgängliga:</strong> {userCredits.filter(c => c.creditType === 'handledar' && c.creditsRemaining > 0).length}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      toast.success('Du kommer att använda en handledarkurskredit')
                      setShowCreditSuggestion(false)
                      // Add logic to use credit for booking
                      handleCreditPayment(bookingData.bookingId || '')
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Använd kredit
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreditSuggestion(false)
                      // Proceed with normal payment
                      setShowSwishDialog(true)
                    }}
                    variant="outline"
                  >
                    Betala istället
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SwishPaymentDialog
          isOpen={showSwishDialog}
          onClose={() => setShowSwishDialog(false)}
          onConfirm={handleSwishConfirm}
          booking={{
            id: bookingData.bookingId || '',
            totalPrice: bookingData.totalPrice
          }}
        />
      </div>
    </div>
  )
}
