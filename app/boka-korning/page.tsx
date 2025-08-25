"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { BookingSteps } from "@/components/booking/booking-steps"
import { LessonSelection } from "@/components/booking/lesson-selection"
import { TransmissionSelection } from "@/components/booking/transmission-selection"
import { WeekCalendar } from "@/components/booking/week-calendar"
import { HandledarSessionSelection } from "@/components/booking/handledar-session-selection"
import { TeoriSessionSelection } from "@/components/booking/teori-session-selection"
import { SessionSelection } from "@/components/booking/session-selection"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { useAuth } from "@/hooks/use-auth"
import { SwishPaymentDialog } from "@/components/booking/swish-payment-dialog"
import { OrbSpinner } from "@/components/ui/orb-loader"
import { toast } from "react-hot-toast"

interface SessionType {
  id: string
  type: 'lesson' | 'handledar' | 'teori';
  name: string
  description: string | null
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  isActive: boolean
  allowsSupervisors?: boolean
  pricePerSupervisor?: number
  maxParticipants?: number
}

interface BookingData {
  sessionType: SessionType | null
  selectedSession: any | null // For unified session system
  transmissionType: "manual" | "automatic" | null
  selectedDate: Date | null
  selectedTime: string | null
  totalPrice: number
  bookingId?: string
  tempBookingId?: string // Track temporary booking for cleanup
  sessionId?: string // Add sessionId for handledar sessions
  isUnifiedSession?: boolean // Flag to distinguish unified vs legacy sessions
}

export default function BokaKorning() {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: null,
    selectedSession: null,
    transmissionType: null,
    selectedDate: null,
    selectedTime: null,
    totalPrice: 0,
    isUnifiedSession: false,
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

  const cleanupTempBooking = async () => {
    if (bookingData.tempBookingId) {
      try {
        await fetch(`/api/booking/cleanup?bookingId=${bookingData.tempBookingId}&sessionType=${bookingData.sessionType?.type}`, {
          method: 'DELETE'
        })
        setBookingData(prev => ({ ...prev, tempBookingId: undefined, bookingId: undefined }))
      } catch (error) {
        console.error('Error cleaning up temporary booking:', error)
      }
    }
  }

  // Cleanup temporary booking on page unload or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (bookingData.tempBookingId) {
        // Use sendBeacon for reliable cleanup on page unload
        navigator.sendBeacon(
          `/api/booking/cleanup?bookingId=${bookingData.tempBookingId}&sessionType=${bookingData.sessionType?.type}`,
          JSON.stringify({ method: 'DELETE' })
        )
      }
    }

    const handlePageHide = async () => {
      if (bookingData.tempBookingId) {
        await cleanupTempBooking()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [bookingData.tempBookingId, bookingData.sessionType?.type, cleanupTempBooking])

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
      // All icke-lektions-typer går via nya sessionsflödet (inkl. handledare/teori)
      isUnifiedSession: Boolean(sessionType.type && sessionType.type !== 'lesson'),
    }))
    
    // Nya sessionsflödet för allt utom lektions-typer
    if (sessionType.type && sessionType.type !== 'lesson') {
      setCurrentStep(2)
    } else {
      // Legacy lektionsflöde (växellåda + kalender)
      setCurrentStep(2)
    }
    
    setShowCreditSuggestion(false)
  }

  const handleStepComplete = (stepData: any) => {
    switch (currentStep) {
      case 1:
        checkHandledarCreditsAndProceed(stepData.sessionType)
        break
      case 2:
        // Enhetligt: sessionsval för alla icke-lektions-typer (inkl. handledare/teori)
        if (bookingData.sessionType?.type && bookingData.sessionType.type !== 'lesson' && stepData.selectedSession) {
          setBookingData((prev) => ({
            ...prev,
            selectedSession: stepData.selectedSession,
            selectedDate: new Date(stepData.selectedSession.date),
            selectedTime: stepData.selectedSession.startTime,
            sessionId: stepData.selectedSession.id,
          }))
          setCurrentStep(4)
        } else {
          // Lektionsflöde: välj växellåda
          setBookingData((prev) => ({
            ...prev,
            transmissionType: stepData.transmissionType,
          }))
          setCurrentStep(3)
        }
        break
      case 3:
        setBookingData((prev) => ({
          ...prev,
          selectedDate: stepData.selectedDate,
          selectedTime: stepData.selectedTime,
          sessionId: stepData.sessionId, // Add sessionId for handledar sessions
          tempBookingId: stepData.bookingId || prev.tempBookingId
        }))
        setCurrentStep(4)
        break
      case 4:
        // Handle final booking confirmation
        handleBookingComplete(stepData)
        break
    }
  }
  
  const handleSessionSelectionBack = () => {
    setCurrentStep(1) // Go back to session type selection
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
    if (user?.role === 'admin' && paymentData.userHasPaid) {
      paymentData.paymentMethod = 'already_paid';
    }
    
    // The booking is already created as temporary, now we need to update it with final details
    if (bookingData.bookingId || bookingData.tempBookingId) {
      try {
        setLoading(true)
        
        // Update the existing temporary booking with final payment method and guest info
        const response = await fetch('/api/booking/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingData.bookingId || bookingData.tempBookingId,
            sessionType: bookingData.sessionType?.type || 'lesson',
            paymentMethod: paymentData.paymentMethod,
            guestName: paymentData.guestName,
            guestEmail: paymentData.guestEmail,
            guestPhone: paymentData.guestPhone,
            studentId: paymentData.studentId,
            alreadyPaid: paymentData.alreadyPaid || false
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update booking')
        }

        const data = await response.json()
        
        // Show payment dialog based on selected method
        if (paymentData.paymentMethod === 'swish') {
          setShowSwishDialog(true)
        } else if (paymentData.paymentMethod === 'credits') {
          // Handle credit payment
          const bookingId = bookingData.bookingId || bookingData.tempBookingId
          if (bookingId) {
            await handleCreditPayment(bookingId)
          }
        } else if (paymentData.paymentMethod === 'pay_at_location') {
          // Handle pay at location
          const bookingId = bookingData.bookingId || bookingData.tempBookingId
          if (bookingId) {
            await handlePayAtLocation(bookingId)
          }
        }
        // Redirect to invoice page if invoice.id is present
        if (data.invoice && data.invoice.id) {
          window.location.href = `/dashboard/invoices/${data.invoice.id}`;
        }
      } catch (error) {
        console.error('Error updating booking:', error)
        toast.error('Ett fel uppstod. Försök igen.')
      } finally {
        setLoading(false)
      }
      return
    }
    
    // Fallback: create booking if somehow we don't have one (shouldn't happen with new flow)
    try {
      setLoading(true)
      
      // Helper to format local date as YYYY-MM-DD without UTC conversion
      const pad2 = (n: number) => String(n).padStart(2, '0')
      const formatLocalYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

      // Create booking (fallback if no temp booking exists)
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: bookingData.sessionType?.type,
          sessionId: bookingData.sessionType?.type === 'handledar' && bookingData.sessionId 
            ? bookingData.sessionId 
            : bookingData.sessionType?.id,
          scheduledDate: bookingData.selectedDate ? formatLocalYmd(bookingData.selectedDate) : undefined,
          startTime: bookingData.selectedTime,
          endTime: bookingData.sessionType?.type === 'handledar' ? 'To be confirmed' : (bookingData.sessionType ? calculateEndTime(bookingData.selectedTime!, bookingData.sessionType.durationMinutes) : ''),
          durationMinutes: bookingData.sessionType?.durationMinutes || 0,
          transmissionType: bookingData.transmissionType,
          totalPrice: bookingData.totalPrice,
          ...paymentData, // Guest info if not logged in
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const data = await response.json()
      setBookingData(prev => ({ 
        ...prev, 
        bookingId: data.booking.id,
        tempBookingId: data.booking.status === 'temp' ? data.booking.id : undefined
      }))

      // Show payment dialog based on selected method
      if (paymentData.paymentMethod === 'swish') {
        setShowSwishDialog(true)
      } else if (paymentData.paymentMethod === 'credits') {
        // Handle credit payment
        const bookingId = data.booking.id
        if (bookingId) {
          await handleCreditPayment(bookingId)
        }
      } else if (paymentData.paymentMethod === 'pay_at_location') {
        // Handle pay at location
        const bookingId = data.booking.id
        if (bookingId) {
          await handlePayAtLocation(bookingId)
        }
      }
      // Redirect to invoice page if invoice.id is present
      if (data.invoice && data.invoice.id) {
        window.location.href = `/dashboard/invoices/${data.invoice.id}`;
      }
    } catch (error) {
      console.error('Error completing booking:', error)
      toast.error('Ett fel uppstod. Försök igen.')
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

  const goBack = async () => {
    if (currentStep > 1) {
      // If going back from step 5 (success) or if we have a temp booking, clean it up
      if (currentStep === 5 || bookingData.tempBookingId) {
        await cleanupTempBooking()
      }
      
      // If going back from step 4 (confirmation) and we have a booking ID, clean it up
      if (currentStep === 4 && bookingData.bookingId) {
        try {
          await fetch(`/api/booking/cleanup?bookingId=${bookingData.bookingId}&sessionType=${bookingData.sessionType?.type}`, {
            method: 'DELETE'
          })
          setBookingData(prev => ({ ...prev, bookingId: undefined, tempBookingId: undefined }))
        } catch (error) {
          console.error('Error cleaning up booking:', error)
        }
      }
      
      setCurrentStep(currentStep - 1)
    }
  }

  const getSteps = () => {
    const sessionType = bookingData.sessionType?.type;
    
    if (sessionType === 'teori') {
      return [
        { number: 1, title: "Välj teorilektion" },
        { number: 2, title: "Välj session & tid" },
        { number: 3, title: "Bekräfta bokning" },
        { number: 4, title: "Betala" },
      ];
    }

    if (sessionType === 'handledar') {
      return [
        { number: 1, title: "Välj handledarkurs" },
        { number: 2, title: "Välj session & tid" },
        { number: 3, title: "Bekräfta bokning" },
        { number: 4, title: "Betala" },
      ];
    }

    // Normal lesson booking
    return [
      { number: 1, title: "Välj körlektion" },
      { number: 2, title: "Välj växellåda" },
      { number: 3, title: "Välj tid" },
      { number: 4, title: "Bekräfta bokning" },
      { number: 5, title: "Betala" },
    ];
  };
  
  const steps = getSteps();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <OrbSpinner size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Laddar bokningssystem</h2>
          <p className="text-gray-600 font-medium">Förbereder din bokningsupplevelse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl py-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Boka körning
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed">Välj session, tid och bekräfta din bokning</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 md:mb-12">
          <BookingSteps currentStep={currentStep} steps={steps} />
        </div>

        {/* Main Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gray-50 rounded-3xl border border-gray-200 shadow-sm"></div>
          <div className="relative p-6 md:p-8 min-h-[600px]">
          {currentStep === 1 && <LessonSelection onComplete={handleStepComplete} />}

          {currentStep === 2 && bookingData.sessionType && bookingData.sessionType.type !== 'lesson' && (
            <SessionSelection 
              sessionType={bookingData.sessionType}
              onComplete={handleStepComplete} 
              onBack={handleSessionSelectionBack} 
            />
          )}

          {currentStep === 2 && bookingData.sessionType?.type === 'lesson' && !bookingData.isUnifiedSession && (
            <TransmissionSelection onComplete={handleStepComplete} onBack={goBack} />
          )}

          {currentStep === 2 && bookingData.sessionType?.type === 'teori' && (
            <TeoriSessionSelection
              sessionType={bookingData.sessionType}
              onComplete={handleStepComplete}
              onBack={goBack}
            />
          )}

          {currentStep === 2 && bookingData.sessionType?.type === 'handledar' && (
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
              totalPrice={bookingData.totalPrice}
              onComplete={handleStepComplete}
              onBack={goBack}
            />
          )}

          {/* Booking Confirmation Step */}
          {((currentStep === 3 && (bookingData.sessionType?.type === 'teori' || bookingData.sessionType?.type === 'handledar')) ||
            (currentStep === 4 && bookingData.sessionType?.type === 'lesson')) && 
            bookingData.selectedDate && bookingData.selectedTime && (
            <BookingConfirmation
              bookingData={{
                lessonType: bookingData.sessionType, // Map sessionType to lessonType for compatibility
                selectedSession: bookingData.selectedSession, // Add unified session data
                selectedDate: bookingData.selectedDate,
                selectedTime: bookingData.selectedTime,
                instructor: null,
                vehicle: null,
                totalPrice: bookingData.totalPrice,
                transmissionType: bookingData.transmissionType,
                tempBookingId: bookingData.tempBookingId, // Pass the temp booking ID
                sessionId: bookingData.sessionId, // Pass the specific sessionId for handledar sessions
                isStudent: (user as any)?.inskriven || false, // Add missing required field
                isHandledarutbildning: bookingData.sessionType?.type === 'handledar', // Add missing required field
                isUnifiedSession: bookingData.isUnifiedSession // Add unified session flag
              }}
              user={user}
              onComplete={handleStepComplete}
              onBack={goBack}
            />
          )}

          {/* Success Step - Dynamic based on lesson type */}
          {((currentStep === 4 && (bookingData.sessionType?.type === 'teori' || bookingData.sessionType?.type === 'handledar')) ||
            (currentStep === 5 && bookingData.sessionType?.type === 'lesson')) && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border border-green-200 mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Bokning bekräftad!</h2>
              <p className="text-gray-700 mb-8 text-lg leading-relaxed font-medium">
                {bookingData.sessionType?.type === 'teori' 
                  ? 'Din teorisession har bokats. Du kommer få en bekräftelse via e-post.'
                  : bookingData.sessionType?.type === 'handledar'
                    ? 'Din handledarkurs har bokats. Du kommer få en bekräftelse via e-post.'
                    : 'Din körlektion har bokats. Du kommer få en bekräftelse via e-post.'}
              </p>
              <Button
                onClick={() => window.location.href = user ? "/dashboard" : "/"}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl px-8 py-3 text-lg font-semibold transition-all duration-200 rounded-lg"
              >
                {user ? "Gå till Min Sida" : "Gå till startsidan"}
              </Button>
            </div>
          )}
        </div>

        {/* Credit Suggestion Modal */}
        {showCreditSuggestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-50 border border-green-200 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">
                  Du har tillgängliga handledarkurskrediter!
                </h3>
                <p className="text-sm text-gray-700 mb-4 font-medium leading-relaxed">
                  Vi har upptäckt att du har handledarkurskrediter tillgängliga. Vill du använda en av dina krediter istället för att betala?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                  <p className="text-sm text-gray-800 font-semibold">
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
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
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
                    className="font-semibold px-4 py-2 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
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
