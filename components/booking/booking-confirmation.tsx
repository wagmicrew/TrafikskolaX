import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button as FBButton, Label as FBLabel, Card as FBCard } from 'flowbite-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { SwishPaymentDialog } from '@/components/booking/swish-payment-dialog'
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog'
import { EmailConflictDialog } from '@/components/booking/email-conflict-dialog'
import { AddStudentPopup } from '@/components/booking/add-student-popup'
import { HandledareRecap } from '@/components/booking/handledare-recap'
import { StudentSelectionForm } from '@/components/booking/student-selection-form'
import { DebugPanel } from '@/components/booking/debug-panel'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface BookingConfirmationProps {
  bookingData: any
  onBack: () => void
  onComplete: (data: any) => void
  isHandledarutbildning?: boolean
}

export function BookingConfirmation({
  bookingData,
  onBack,
  onComplete,
  isHandledarutbildning = false,
}: BookingConfirmationProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser, isAuthenticated } = useAuth()

  // Helper function to check if user is admin or teacher
  const isAdminOrTeacher = authUser?.role === 'admin' || authUser?.role === 'teacher'

  // Student selection state
  const [selectedStudent, setSelectedStudent] = useState<string>(authUser?.userId || '')
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)

  // Guest booking state (for non-authenticated users)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [emailValidationStatus, setEmailValidationStatus] = useState<'checking' | 'exists' | 'available' | null>(null)
  const [showEmailConflictDialog, setShowEmailConflictDialog] = useState(false)
  const [conflictingEmail, setConflictingEmail] = useState('')

  // Handledare (supervisor) related state
  const [allowsSupervisors, setAllowsSupervisors] = useState(false)
  const [handledarsteg, setHandledarsteg] = useState(false)
  const [supervisorCount, setSupervisorCount] = useState(1)
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [supervisorPhone, setSupervisorPhone] = useState('')
  const [pricePerSupervisor, setPricePerSupervisor] = useState(0)

  // Payment related state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [hasHandledarCredits, setHasHandledarCredits] = useState(false)
  const [canUseCredits, setCanUseCredits] = useState(false)
  const [canPayAtLocation, setCanPayAtLocation] = useState(true)
  const [unpaidBookings, setUnpaidBookings] = useState(0)
  const [showUnpaidWarning, setShowUnpaidWarning] = useState(false)
  const [qliroAvailable, setQliroAvailable] = useState(true)
  const [qliroStatusMessage, setQliroStatusMessage] = useState('')
  const [qliroStatusLoading, setQliroStatusLoading] = useState(false)
  const [qliroCheckoutUrl, setQliroCheckoutUrl] = useState('')

  // UI state
  const [showSwishDialog, setShowSwishDialog] = useState(false)
  const [showQliroDialog, setShowQliroDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [capacityError, setCapacityError] = useState(false)
  const [isStudent, setIsStudent] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  // Initialize component
  useEffect(() => {
    initializeComponent()
  }, [bookingData.sessionId])

  const initializeComponent = async () => {
    await fetchSessionDetails()
    await fetchDebugMode()
    await checkUserStatus()
  }

  // Fetch session data from teori_sessions table
  const fetchSessionDetails = async () => {
    if (!bookingData.sessionId) return

    try {
      const response = await fetch(`/api/teori/sessions/${bookingData.sessionId}`)
      if (response.ok) {
        const data = await response.json()

        if (data.session) {
          const session = data.session
          const lessonType = session.lessonType

          // Update booking data with accurate information from the session
          updateBookingData(session, lessonType)

          if (debugMode) {
            console.log('Session details fetched:', session)
          }
        }
      } else {
        throw new Error('Failed to fetch session details')
      }
    } catch (error) {
      console.error('Error fetching session details:', error)
      showNotification('Fel', 'Kunde inte hämta sessionsinformation', 'error')
    }
  }

  const updateBookingData = (session: any, lessonType: any) => {
    // Calculate duration from start and end times
    let durationMinutes = 0
    if (session.startTime && session.endTime) {
      const startTime = new Date(`1970-01-01T${session.startTime}`)
      const endTime = new Date(`1970-01-01T${session.endTime}`)
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    }

    // Update booking data (this would normally update parent state)
    // For now, we'll just log the updated data
    const updatedData = {
      ...bookingData,
      totalPrice: (() => {
        const s = session?.price
        const lp = lessonType?.price
        const v = s ?? lp ?? 0
        return typeof v === 'string' ? parseFloat(v) : Number(v)
      })(),
      sessionTitle: session.title,
      maxParticipants: session.maxParticipants,
      durationMinutes,
    }

    if (debugMode) {
      console.log('Updated booking data:', updatedData)
    }

    // Update supervisor-related information
    setPricePerSupervisor(() => {
      const v = lessonType?.pricePerSupervisor ?? 0
      return typeof v === 'string' ? parseFloat(v) : Number(v)
    })
    setAllowsSupervisors(lessonType.allowsSupervisors || false)
    setHandledarsteg(lessonType.allowsSupervisors || false)
  }

  const fetchDebugMode = async () => {
    try {
      const response = await fetch('/api/config/debug')
      if (response.ok) {
        const data = await response.json()
        setDebugMode(data.debugMode || false)
      }
    } catch (error) {
      console.error('Error fetching debug mode:', error)
    }
  }

  const checkUserStatus = async () => {
    if (!authUser) return

    try {
      // Check user credits and unpaid bookings
      const creditsResponse = await fetch('/api/user/credits')
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setUserCredits(creditsData.credits || 0)
        setHasHandledarCredits(creditsData.hasHandledarCredits || false)
        setCanUseCredits(creditsData.canUseCredits || false)
      }

      const bookingsResponse = await fetch('/api/user/bookings/unpaid')
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        setUnpaidBookings(bookingsData.count || 0)
        setCanPayAtLocation(bookingsData.canPayAtLocation || true)
        setShowUnpaidWarning(bookingsData.showWarning || false)
      }

      // Determine if user is a student
      setIsStudent(authUser.role === 'student')
    } catch (error) {
      console.error('Error checking user status:', error)
    }
  }

  // Utility functions
  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} SEK`
  }

  const showNotification = (title: string, description: string, type: 'success' | 'error' | 'warning' = 'success') => {
    toast({
      title,
      description,
      variant: type === 'error' ? 'destructive' : 'default',
    })
  }

  // Event handlers
  const handleStudentAdded = (student: { id: string; firstName: string; lastName: string; email: string }) => {
    setSelectedStudent(student.id)
    setShowAddStudentDialog(false)
  }

  const handleEmailChange = (email: string, isGuest: boolean) => {
    if (isGuest) {
      setGuestEmail(email)
    } else {
      setSupervisorEmail(email)
    }

    // Email validation logic
    setEmailValidationStatus('checking')
    // Simulate email validation
    setTimeout(() => {
      setEmailValidationStatus(email.includes('@') ? 'available' : null)
    }, 1000)
  }

  const handleUseExistingAccount = () => {
    setShowEmailConflictDialog(false)
    // Handle existing account logic
  }

  const handleUseNewEmail = () => {
    setShowEmailConflictDialog(false)
    setConflictingEmail('')
    // Handle new email logic
  }

  const handleLoginSuccess = () => {
    setShowEmailConflictDialog(false)
    // Handle login success
  }

  const handleSubmit = async () => {
    setLoading(true)
    setShowLoader(true)

    if (debugMode) {
      console.log('Booking submission started with data:', {
        bookingData,
        selectedStudent,
        selectedPaymentMethod,
        supervisorCount,
        alreadyPaid,
      })
    }

    if (capacityError) {
      showNotification('Fel', 'Kan inte boka - otillräcklig kapacitet', 'error')
      return
    }

    if (!selectedPaymentMethod && !alreadyPaid) {
      showNotification('Välj betalningssätt', 'Vänligen välj ett betalningssätt för att fortsätta', 'error')
      return
    }

    // Additional validations
    if (isAdminOrTeacher && !selectedStudent) {
      showNotification('Välj student', 'Vänligen välj en student för att fortsätta', 'error')
      return
    }

    if (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) {
      showNotification('Kontaktuppgifter krävs', 'Fyll i dina kontaktuppgifter först', 'error')
      return
    }

    if (allowsSupervisors && supervisorCount > 0 && (!supervisorName || !supervisorEmail || !supervisorPhone)) {
      showNotification('Handledarinformation krävs', 'Fyll i handledarens uppgifter', 'error')
      return
    }

    try {
      const completionData = {
        bookingData: {
          ...bookingData,
          studentId: isAdminOrTeacher ? selectedStudent : authUser?.userId,
          supervisorCount,
          supervisorName: allowsSupervisors ? supervisorName : null,
          supervisorEmail: allowsSupervisors ? supervisorEmail : null,
          supervisorPhone: allowsSupervisors ? supervisorPhone : null,
          paymentMethod: selectedPaymentMethod,
          alreadyPaid,
          guestName: !authUser ? guestName : null,
          guestEmail: !authUser ? guestEmail : null,
          guestPhone: !authUser ? guestPhone : null,
        },
        debugMode,
      }

      if (debugMode) {
        console.log('Booking completion data:', completionData)
      }

      onComplete(completionData)

      // Handle payment dialogs
      if (selectedPaymentMethod === 'swish') {
        setShowSwishDialog(true)
      } else if (selectedPaymentMethod === 'qliro') {
        setShowQliroDialog(true)
      } else {
        // For other payment methods, redirect to success page
        setTimeout(() => {
          router.push('/betalhubben')
        }, 1000)
      }
    } catch (error) {
      console.error('Error during booking submission:', error)
      showNotification('Fel', 'Ett fel uppstod vid bokning', 'error')
    } finally {
      setLoading(false)
      setShowLoader(false)
    }
  }

  const calculateTotalPrice = () => {
    const basePrice = bookingData.totalPrice || 0
    const supervisorCost = supervisorCount * pricePerSupervisor
    return basePrice + supervisorCost
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Bekräfta bokning</h1>
                <p className="text-gray-600">
                  Granska dina uppgifter och slutför bokningen
                </p>
              </div>

              {/* Session Information */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {bookingData.sessionTitle || 'Teorilektion'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Datum och tid</p>
                    <p className="font-medium">
                      {bookingData.selectedDate instanceof Date
                        ? bookingData.selectedDate.toLocaleDateString('sv-SE')
                        : bookingData.selectedDate
                      } {bookingData.selectedTime}
                    </p>
                    {bookingData.durationMinutes && (
                      <p className="text-sm text-gray-500">
                        Varaktighet: {bookingData.durationMinutes} minuter
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Pris</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(calculateTotalPrice())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isAdminOrTeacher ? 'Välj student' : 'Deltagarinformation'}
                </h3>

                {isAdminOrTeacher ? (
                  <StudentSelectionForm
                    selectedStudent={selectedStudent}
                    onStudentChange={setSelectedStudent}
                    onShowAddStudent={() => setShowAddStudentDialog(true)}
                  />
                ) : authUser ? (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">{`${authUser.firstName} ${authUser.lastName}`}</p>
                    <p className="text-sm text-blue-700">{authUser.email}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guest-name" className="text-sm font-medium">
                        Namn *
                      </Label>
                      <Input
                        id="guest-name"
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="För- och efternamn"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest-email" className="text-sm font-medium">
                        E-post *
                      </Label>
                      <div className="relative">
                        <Input
                          id="guest-email"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => handleEmailChange(e.target.value, true)}
                          placeholder="exempel@email.com"
                          className={`mt-1 ${
                            emailValidationStatus === 'checking' ? 'border-yellow-400' :
                            emailValidationStatus === 'exists' ? 'border-red-400' :
                            emailValidationStatus === 'available' ? 'border-green-400' : ''
                          }`}
                        />
                        {emailValidationStatus === 'checking' && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-yellow-500" />
                        )}
                        {emailValidationStatus === 'available' && (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                        {emailValidationStatus === 'exists' && (
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="guest-phone" className="text-sm font-medium">
                        Telefon *
                      </Label>
                      <Input
                        id="guest-phone"
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="070-123 45 67"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Handledare Information */}
              {allowsSupervisors && (
                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Handledarinformation
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="supervisor-name" className="text-sm font-medium">
                        Namn *
                      </Label>
                      <Input
                        id="supervisor-name"
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        placeholder="För- och efternamn"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supervisor-email" className="text-sm font-medium">
                        E-post *
                      </Label>
                      <div className="relative">
                        <Input
                          id="supervisor-email"
                          type="email"
                          value={supervisorEmail}
                          onChange={(e) => handleEmailChange(e.target.value, false)}
                          placeholder="exempel@email.com"
                          className={`mt-1 ${
                            emailValidationStatus === 'checking' ? 'border-yellow-400' :
                            emailValidationStatus === 'exists' ? 'border-red-400' :
                            emailValidationStatus === 'available' ? 'border-green-400' : ''
                          }`}
                        />
                        {emailValidationStatus === 'checking' && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-yellow-500" />
                        )}
                        {emailValidationStatus === 'available' && (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                        {emailValidationStatus === 'exists' && (
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="supervisor-phone" className="text-sm font-medium">
                        Telefon *
                      </Label>
                      <Input
                        id="supervisor-phone"
                        type="tel"
                        value={supervisorPhone}
                        onChange={(e) => setSupervisorPhone(e.target.value)}
                        placeholder="070-123 45 67"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Handledare Recap */}
              <HandledareRecap
                allowsSupervisors={allowsSupervisors}
                supervisorCount={supervisorCount}
                pricePerSupervisor={pricePerSupervisor}
                onSupervisorCountChange={setSupervisorCount}
                formatPrice={formatPrice}
              />

              {/* Payment Methods */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Välj betalningsmetod
                </h3>

                {hasHandledarCredits && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Du har {userCredits} handledarkredit{userCredits > 1 ? 'er' : ''} tillgängliga!
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Du kan använda dina krediter för denna handledarutbildning.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment method options */}
                <div className="space-y-4">
                  {/* Credits option */}
                  {canUseCredits && (
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'credits' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('credits')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                          selectedPaymentMethod === 'credits' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                        }`}>
                          {selectedPaymentMethod === 'credits' && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium">Använd mina krediter</p>
                          <p className="text-sm text-gray-500">
                            {hasHandledarCredits
                              ? `Använd ${userCredits} kredit${userCredits > 1 ? 'er' : ''} för denna handledarutbildning`
                              : `Du har ${userCredits} kredit${userCredits !== 1 ? 'er' : ''} kvar`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Swish option */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'swish' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('swish')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                        selectedPaymentMethod === 'swish' ? 'border-green-500 bg-green-500' : 'border-gray-400'
                      }`}>
                        {selectedPaymentMethod === 'swish' && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium">Swish</p>
                        <p className="text-sm text-gray-500">Betala direkt med Swish</p>
                      </div>
                    </div>
                  </div>

                  {/* Other payment options would go here */}
                </div>

                {/* Already Paid option for admin/teacher */}
                {isAdminOrTeacher && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="already-paid"
                        checked={alreadyPaid}
                        onCheckedChange={(checked) => setAlreadyPaid(checked === true)}
                      />
                      <Label htmlFor="already-paid" className="text-sm font-medium">
                        Eleven har redan betalat (bekräftad betalning)
                      </Label>
                    </div>
                    {alreadyPaid && (
                      <p className="text-xs text-green-600 mt-2">
                        Bokningen kommer att markeras som bekräftad och betald
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || (isAdminOrTeacher && !selectedStudent) || (!isAdminOrTeacher && !selectedPaymentMethod && !alreadyPaid)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin inline-block h-4 w-4 border-2 border-white/40 border-t-white"></Loader2>
                      Genomför bokning
                    </span>
                  ) : (
                    "Bekräfta bokning"
                  )}
                </Button>

                <Button variant="outline" onClick={onBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <SwishPaymentDialog
        isOpen={showSwishDialog}
        onClose={() => setShowSwishDialog(false)}
        booking={{
          id: bookingData.tempBookingId || bookingData.id || `temp-${Date.now()}`,
          totalPrice: calculateTotalPrice()
        }}
        bookingData={{
          lessonType: bookingData.lessonType,
          selectedDate: bookingData.selectedDate,
          selectedTime: bookingData.selectedTime,
          totalPrice: calculateTotalPrice(),
          guestName: isHandledarutbildning ? supervisorName : guestName,
          guestEmail: isHandledarutbildning ? supervisorEmail : guestEmail,
          guestPhone: isHandledarutbildning ? supervisorPhone : guestPhone,
          studentId: isAdminOrTeacher ? selectedStudent : undefined
        }}
        onConfirm={() => {
          setShowSwishDialog(false)
          router.push('/betalhubben')
        }}
      />

      <QliroPaymentDialog
        isOpen={showQliroDialog}
        onClose={() => setShowQliroDialog(false)}
        purchaseId={`booking-${Date.now()}`}
        amount={calculateTotalPrice()}
        checkoutUrl={qliroCheckoutUrl}
        onConfirm={() => {
          setShowQliroDialog(false)
          router.push('/betalhubben')
        }}
      />

      <EmailConflictDialog
        isOpen={showEmailConflictDialog}
        onClose={() => setShowEmailConflictDialog(false)}
        existingEmail={conflictingEmail}
        onUseExistingAccount={handleUseExistingAccount}
        onUseNewEmail={handleUseNewEmail}
        onLoginSuccess={handleLoginSuccess}
      />

      <AddStudentPopup
        isOpen={showAddStudentDialog}
        onClose={() => setShowAddStudentDialog(false)}
        onStudentAdded={handleStudentAdded}
      />

      {/* Debug Panel */}
      <DebugPanel
        bookingData={bookingData}
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(!debugMode)}
      />
    </>
  )
}
