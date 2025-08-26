"use client";

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react'
import { OrbLoader } from '@/components/ui/orb-loader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useAuthActions } from '@/hooks/useAuthActions'
import { toast, Toaster } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { SwishPaymentDialog } from './swish-payment-dialog'
import { QliroPaymentDialog } from './qliro-payment-dialog'
import { useQliroListener } from '@/hooks/use-qliro-listener'
import { EmailConflictDialog } from './email-conflict-dialog'
import { AddStudentPopup } from './add-student-popup'

interface LessonType {
  id: string
  type?: 'lesson' | 'handledar'
  name: string
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  allowsSupervisors?: boolean
  pricePerSupervisor?: number
}

interface Instructor {
  id: string
  name: string
}

interface Vehicle {
  id: string
  name: string
}

interface BookingData {
  lessonType: LessonType
  selectedDate: Date
  selectedTime: string
  instructor: Instructor | null
  vehicle: Vehicle | null
  totalPrice: number
  isStudent: boolean
  isHandledarutbildning: boolean
  transmissionType?: "manual" | "automatic" | null
  [key: string]: any // Allow additional properties
  bookingId?: string // Added for existing bookings
  tempBookingId?: string // Added for temporary bookings
}

interface BookingCompletionData {
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  paymentMethod: string
  studentId?: string
  alreadyPaid: boolean
  totalPrice: number
  lessonType: LessonType
}

interface BookingConfirmationProps {
  bookingData: BookingData
  user: any
  onComplete: (data: BookingCompletionData) => void
  onBack: () => void
}

export function BookingConfirmation({
  bookingData,
  user,
  onComplete,
  onBack
}: BookingConfirmationProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [alreadyPaid, setAlreadyPaid] = useState<boolean | 'indeterminate'>(false)
  const [loading, setLoading] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [userCredits, setUserCredits] = useState<number>(0)
  const [unpaidBookings, setUnpaidBookings] = useState<number>(0)

  // Computed values (moved to after variable declarations)
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [supervisorPhone, setSupervisorPhone] = useState('')
  const [participantCount, setParticipantCount] = useState(1)
  const [maxParticipants, setMaxParticipants] = useState(1)
  const [supervisorCount, setSupervisorCount] = useState(0)
  const [supervisorDetails, setSupervisorDetails] = useState<Array<{ name: string; phone: string }>>([])
  const [capacityError, setCapacityError] = useState<string | null>(null)
  const [showAddSupervisor, setShowAddSupervisor] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [showSwishDialog, setShowSwishDialog] = useState(false)
  const [showQliroDialog, setShowQliroDialog] = useState(false)
  const [qliroCheckoutUrl, setQliroCheckoutUrl] = useState('')
  const [showEmailConflictDialog, setShowEmailConflictDialog] = useState(false)
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
  const [conflictingEmail, setConflictingEmail] = useState('')
  const [emailValidationStatus, setEmailValidationStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle')
  const [existingUserName, setExistingUserName] = useState('')
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const { user: authUser } = useAuth()
  const { handleLogin } = useAuthActions()
  useQliroListener({
    onCompleted: () => {
      const id = bookingData.id || bookingData.tempBookingId
      if (id) try { window.location.href = `/qliro/return?ref=${encodeURIComponent(`booking_${id}`)}&status=paid` } catch {}
    },
    onDeclined: () => {
      showNotification('Betalning nekades', 'Försök igen eller välj en annan metod', 'error')
    }
  })

  // When admin/teacher selects a student, auto-fill guest fields from users table
  useEffect(() => {
    try {
      if (selectedStudent && Array.isArray(students) && students.length > 0) {
        const s = students.find((u) => u.id === selectedStudent)
        if (s) {
          const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ').trim()
          if (!bookingData.isHandledarutbildning) {
            if (fullName) setGuestName(fullName)
            if (s.email) setGuestEmail(String(s.email))
            if (s.phone) setGuestPhone(String(s.phone))
          } else {
            // For handledar, use supervisor fields
            if (fullName) setSupervisorName(fullName)
            if (s.email) setSupervisorEmail(String(s.email))
            if (s.phone) setSupervisorPhone(String(s.phone))
          }
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent])
  
  // Qliro availability state
  const [qliroAvailable, setQliroAvailable] = useState<boolean>(true)
  const [qliroStatusMessage, setQliroStatusMessage] = useState<string>('')
  const [qliroStatusLoading, setQliroStatusLoading] = useState<boolean>(true)
  
  // Toast notification helper function
  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(`${title}: ${message}`)
        break
      case 'error':
        toast.error(`${title}: ${message}`)
        break
      case 'warning':
        toast.warning(`${title}: ${message}`)
        break
      default:
        toast.info(`${title}: ${message}`)
    }
  }

  // Email validation helper
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Local date formatting helper to avoid UTC shifts
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const formatLocalYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

  // Debounced email existence check
  const checkEmailExists = async (email: string) => {
    if (!validateEmail(email)) {
      setEmailValidationStatus('idle')
      return
    }

    setEmailValidationStatus('checking')
    try {
      const response = await fetch('/api/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setEmailValidationStatus('exists')
          setExistingUserName(data.userName || 'okänd användare')
          setConflictingEmail(email)
          setShowEmailConflictDialog(true)
        } else {
          setEmailValidationStatus('available')
        }
      } else {
        setEmailValidationStatus('idle')
      }
    } catch (error) {
      console.error('Error checking email:', error)
      setEmailValidationStatus('idle')
    }
  }

  // Handle email input changes with debouncing
  const handleEmailChange = (email: string, isGuestEmail: boolean = true) => {
    if (isGuestEmail) {
      setGuestEmail(email)
    } else {
      setSupervisorEmail(email)
    }

    // Only check for guests (not logged in users)
    if (!authUser && validateEmail(email)) {
      // Clear existing timeout
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }

      // Set new timeout for debounced check
      const timeout = setTimeout(() => {
        checkEmailExists(email)
      }, 800) // 800ms delay

      setEmailCheckTimeout(timeout)
    } else {
      setEmailValidationStatus('idle')
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }
    }
  }, [emailCheckTimeout])

  const isAdminOrTeacher = authUser?.role === 'admin' || authUser?.role === 'teacher'
  const isStudent = authUser?.role === 'student'
  const isGuest = !authUser
  const isHandledarutbildning = bookingData && (bookingData.lessonType.name === 'Handledarutbildning' ||
                              bookingData.lessonType.name.toLowerCase().includes('handledarutbildning'))

  // Computed values
  const hasHandledarCredits = userCredits > 0 && bookingData.isHandledarutbildning
  const canUseCredits = isStudent && userCredits > 0 && (isHandledarutbildning || bookingData.lessonType?.id)
  const canPayAtLocation = isStudent && unpaidBookings < 2

  // Check Qliro availability on component mount
  useEffect(() => {
    const checkQliroStatus = async () => {
      try {
        setQliroStatusLoading(true)
        const response = await fetch('/api/payments/qliro/status')
        if (response.ok) {
          const data = await response.json()
          setQliroAvailable(data.available)
          setQliroStatusMessage(data.message || '')
        } else {
          setQliroAvailable(false)
          setQliroStatusMessage('Kunde inte kontrollera Qliro-status')
        }
      } catch (error) {
        console.error('Failed to check Qliro status:', error)
        setQliroAvailable(false)
        setQliroStatusMessage('Qliro-tjänsten är för närvarande inte tillgänglig')
      } finally {
        setQliroStatusLoading(false)
      }
    }

    checkQliroStatus()
  }, [])

  useEffect(() => {
    // Background listener for Qliro popup messages
    const listener = (event: MessageEvent) => {
      const data = event.data || {}
      const id = bookingData.id || bookingData.tempBookingId
      if (!id) return
      const done = data && (data.type === 'qliro:completed' || data.event === 'payment_completed' || data.event === 'CheckoutCompleted' || data.status === 'Paid' || data.status === 'Completed')
      if (done) {
        try { window.location.href = `/qliro/return?ref=${encodeURIComponent(`booking_${id}`)}&status=paid` } catch {}
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [bookingData?.id, bookingData?.tempBookingId])

  useEffect(() => {
    if (isAdminOrTeacher) {
      fetchStudents()
    }
    if (isStudent) {
      fetchUserCredits()
      fetchUnpaidBookings()
    }
  }, [isAdminOrTeacher, isStudent])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students?excludeTemp=true&inskrivenOnly=false')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchUserCredits = async () => {
    try {
      // Check if this is Handledarutbildning - if so, fetch handledar credits
      // Using the component-level isHandledarutbildning constant
      
      let response;
      if (isHandledarutbildning) {
        // Fetch handledar credits (generic ones without specific session ID)
        response = await fetch('/api/user/credits?creditType=handledar')
      } else {
        // Fetch lesson credits for the specific lesson type
        response = await fetch(`/api/user/credits?lessonTypeId=${bookingData.lessonType.id}`)
      }
      
      if (response.ok) {
        const data = await response.json()
        if (isHandledarutbildning && data.credits) {
          // Sum up all generic handledar credits (where handledarSessionId is null)
          const genericHandledarCredits = data.credits
            .filter((credit: any) => !credit.handledarSessionId)
            .reduce((sum: number, credit: any) => sum + credit.creditsRemaining, 0)
          setUserCredits(genericHandledarCredits)
        } else {
          setUserCredits(data.credits || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  const fetchUnpaidBookings = async () => {
    try {
      const response = await fetch('/api/user/unpaid-bookings')
      if (response.ok) {
        const data = await response.json()
        setUnpaidBookings(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unpaid bookings:', error)
    }
  }

  // Show warning if user has too many unpaid bookings
  const showUnpaidWarning = isStudent && unpaidBookings >= 2 && 
                          (selectedPaymentMethod === 'pay_at_location' || !selectedPaymentMethod);

  // Computed values for supervisor functionality
  const allowsSupervisors = bookingData.lessonType?.allowsSupervisors || false;
  const pricePerSupervisor = bookingData.lessonType?.pricePerSupervisor || 0;
  const isHandledarSession = isHandledarutbildning;
  const finalTotalPrice = bookingData.totalPrice + (supervisorCount * pricePerSupervisor);

  // Missing handler functions
  const handleUseExistingAccount = () => {
    setShowEmailConflictDialog(false);
  };

  const handleUseNewEmail = () => {
    setShowEmailConflictDialog(false);
  };

  const handleLoginSuccess = () => {
    setShowEmailConflictDialog(false);
  };

  const handleStudentAdded = () => {
    setShowAddStudentDialog(false);
    fetchStudents();
  };

  const handleSubmit = async () => {
    setLoading(true)
    setShowLoader(true)
    
    try {
      // Check capacity error first
      if (capacityError) {
        showNotification('Fel', 'Kan inte boka - otillräcklig kapacitet', 'error')
        return
      }

      // Regular flow - check payment method selection
      if (!selectedPaymentMethod && !alreadyPaid) {
        showNotification('Välj betalningssätt', 'Vänligen välj ett betalningssätt för att fortsätta', 'error')
        return
      }

      // Validate guest information for non-logged-in users
      if (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) {
        showNotification('Kontaktuppgifter krävs', 'Fyll i alla kontaktuppgifter', 'error')
        return
      }

      // Validate supervisor information for handledar sessions
      if (isHandledarSession && (!supervisorName || !supervisorEmail || !supervisorPhone)) {
        showNotification('Handledare information krävs', 'Fyll i alla handledare uppgifter', 'error')
        return
      }

      // Validate supervisor details for regular lessons with supervisors
      if (supervisorCount > 0 && supervisorDetails.length < supervisorCount) {
        showNotification('Handledare information krävs', 'Fyll i information för alla handledare', 'error')
        return
      }

      // Complete the booking
      const completionData: BookingCompletionData = {
        guestName: isHandledarSession ? supervisorName : guestName,
        guestEmail: isHandledarSession ? supervisorEmail : guestEmail,
        guestPhone: isHandledarSession ? supervisorPhone : guestPhone,
        paymentMethod: selectedPaymentMethod || 'already_paid',
        studentId: isAdminOrTeacher ? selectedStudent : undefined,
        alreadyPaid: Boolean(alreadyPaid),
        totalPrice: finalTotalPrice,
        lessonType: bookingData.lessonType
      }

      onComplete(completionData)
      
    } catch (error) {
      console.error('Booking creation error:', error)
      showNotification('Fel', 'Ett oväntat fel uppstod', 'error')
    } finally {
      setLoading(false)
      setShowLoader(false)
    }
  }

  return (
    <>
      <OrbLoader isVisible={showLoader} text="Laddar..." />
      <div className="relative bg-white min-h-screen">
        <Toaster position="top-right" richColors />
        <Card className="w-full max-w-2xl mx-auto bg-white shadow-lg border border-gray-100">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Bekräfta bokning</h2>
              <p className="text-lg text-gray-700 font-medium leading-relaxed">
                Kontrollera dina bokningsdetaljer nedan
              </p>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bokningssammanfattning</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Lektionstyp:</span>
                  <span className="text-gray-900 font-semibold">{bookingData.lessonType.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Datum:</span>
                  <span className="text-gray-900 font-semibold">{formatLocalYmd(bookingData.selectedDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Tid:</span>
                  <span className="text-gray-900 font-semibold">{bookingData.selectedTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Pris:</span>
                  <span className="text-gray-900 font-semibold">{bookingData.totalPrice} kr</span>
                </div>
                {supervisorCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Handledare ({supervisorCount}):</span>
                    <span className="text-gray-900 font-semibold">{supervisorCount * pricePerSupervisor} kr</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-bold border-t border-gray-200 pt-3 mt-3 text-lg">
                  <span className="text-gray-800">Totalt:</span>
                  <span className="text-gray-900">{finalTotalPrice} kr</span>
                </div>
              </div>
            </div>

            {/* Student Selection for Admin/Teacher */}
            {isAdminOrTeacher && (
              <div className="bg-blue-50 p-6 rounded-xl mb-6 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Välj elev</h3>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Välj en elev" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setShowAddStudentDialog(true)}
                  variant="outline"
                  className="mt-3 w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Lägg till ny elev
                </Button>
              </div>
            )}

            {/* Handledare Section */}
            {allowsSupervisors && !isHandledarSession && (
              <div className="bg-blue-50 p-6 rounded-xl mb-6 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Lägg till handledare</h3>
                <p className="text-sm text-gray-700 mb-5 font-medium">
                  Du kan lägga till handledare för {pricePerSupervisor} kr per person.
                </p>
                
                <div className="flex items-center gap-4 mb-5">
                  <label className="text-sm font-semibold text-gray-800">
                    Antal handledare:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSupervisorCount(Math.max(0, supervisorCount - 1))}
                      className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center text-gray-700 font-bold transition-all"
                      disabled={supervisorCount <= 0}
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-lg text-gray-900">{supervisorCount}</span>
                    <button
                      type="button"
                      onClick={() => setSupervisorCount(supervisorCount + 1)}
                      className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {supervisorCount > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-800">Handledare information:</p>
                    {Array.from({ length: supervisorCount }, (_, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Handledare {index + 1} - Namn
                          </label>
                          <input
                            type="text"
                            value={supervisorDetails[index]?.name || ''}
                            onChange={(e) => {
                              const newDetails = [...supervisorDetails];
                              newDetails[index] = { ...newDetails[index], name: e.target.value };
                              setSupervisorDetails(newDetails);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                            placeholder="Ange namn"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Telefonnummer
                          </label>
                          <input
                            type="tel"
                            value={supervisorDetails[index]?.phone || ''}
                            onChange={(e) => {
                              const newDetails = [...supervisorDetails];
                              newDetails[index] = { ...newDetails[index], phone: e.target.value };
                              setSupervisorDetails(newDetails);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                            placeholder="Ange telefonnummer"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Capacity Error Display */}
                {capacityError && (
                  <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{capacityError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guest Information for non-logged-in users */}
            {!authUser && !isAdminOrTeacher && !isHandledarSession && (
              <div className="bg-amber-50 p-6 rounded-xl mb-6 border border-amber-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Dina kontaktuppgifter</h3>
                <p className="text-sm text-gray-700 mb-5 font-medium">
                  Vi behöver dina kontaktuppgifter för att skapa ett konto och skicka bokningsbekräftelse.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guest-name" className="text-sm font-semibold text-gray-800">Namn *</Label>
                    <Input
                      id="guest-name"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="För- och efternamn"
                      className="mt-2 px-4 py-3 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-email" className="text-sm font-medium text-gray-700">E-post *</Label>
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
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                        </div>
                      )}
                      {emailValidationStatus === 'available' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      {emailValidationStatus === 'exists' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    {emailValidationStatus === 'available' && (
                      <p className="text-xs text-green-600 mt-1">E-postadressen är tillgänglig</p>
                    )}
                    {emailValidationStatus === 'exists' && (
                      <p className="text-xs text-red-600 mt-1">E-postadressen är redan registrerad</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="guest-phone" className="text-sm font-medium text-gray-700">Telefon *</Label>
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
                <div className="mt-4 p-3 bg-blue-100 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>OBS!</strong> Ett konto kommer att skapas med dessa uppgifter. 
                    Inloggningsuppgifter skickas till din e-post tillsammans med bokningsbekräftelsen.
                  </p>
                </div>
                
                {/* CTA for guest users to create account */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">
                        Skapa ditt konto först
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Få tillgång till dina bokningar, krediter och enklare betalningar genom att skapa ett konto.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => window.location.href = '/registrering'}
                          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          Skapa konto
                        </button>
                        <button
                          onClick={() => window.location.href = '/login'}
                          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          Logga in
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Eller fortsätt som gäst - du kan alltid skapa konto senare.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Supervisor Information for Handledar Sessions */}
            {isHandledarSession && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Handledare information</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="supervisor-name" className="text-sm font-medium text-gray-700">Namn *</Label>
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
                    <Label htmlFor="supervisor-email" className="text-sm font-medium text-gray-700">E-post *</Label>
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
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                        </div>
                      )}
                      {emailValidationStatus === 'available' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      {emailValidationStatus === 'exists' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                    {emailValidationStatus === 'available' && (
                      <p className="text-xs text-green-600 mt-1">E-postadressen är tillgänglig</p>
                    )}
                    {emailValidationStatus === 'exists' && (
                      <p className="text-xs text-red-600 mt-1">E-postadressen är redan registrerad</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="supervisor-phone" className="text-sm font-medium text-gray-700">Telefon *</Label>
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

            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Välj betalningsmetod</h3>
              
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
              
              {canUseCredits && (
                <div 
                  className={`border rounded-lg p-4 ${
                    (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone))
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer transition-colors'
                  } ${selectedPaymentMethod === 'credits' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => {
                    if (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) {
                      showNotification('Kontaktuppgifter krävs', 'Fyll i dina kontaktuppgifter först', 'error');
                      return;
                    }
                    setSelectedPaymentMethod('credits');
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${selectedPaymentMethod === 'credits' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
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

              {/* Booking ID */}
              {(bookingData.tempBookingId || bookingData.id) && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg mb-4">
                  <strong>Boknings-ID:</strong> {bookingData.id || bookingData.tempBookingId}
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="font-medium">Välj betalningssätt</h3>
                
                {/* Guest validation warning */}
                {!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Kontaktuppgifter krävs</AlertTitle>
                    <AlertDescription>
                      Du måste fylla i dina kontaktuppgifter innan du kan välja betalningsmetod.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Swish Option */}
                <div 
                  className={`border rounded-lg p-4 ${
                    (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone))
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer transition-colors'
                  } ${
                    selectedPaymentMethod === 'swish' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) {
                      showNotification('Kontaktuppgifter krävs', 'Fyll i dina kontaktuppgifter först', 'error');
                      return;
                    }
                    setSelectedPaymentMethod('swish');
                  }}
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

                {/* Qliro Option */}
                <div 
                  className={`border rounded-lg p-4 ${
                    (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) || !qliroAvailable
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer transition-colors'
                  } ${
                    selectedPaymentMethod === 'qliro' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) {
                      showNotification('Kontaktuppgifter krävs', 'Fyll i dina kontaktuppgifter först', 'error');
                      return;
                    }
                    if (qliroAvailable) {
                      setSelectedPaymentMethod('qliro');
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      selectedPaymentMethod === 'qliro' ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                    }`}>
                      {selectedPaymentMethod === 'qliro' && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium ${!qliroAvailable ? 'text-gray-500' : ''}`}>Qliro</p>
                        {qliroStatusLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>}
                      </div>
                      <p className={`text-sm ${!qliroAvailable ? 'text-gray-400' : 'text-gray-500'}`}>
                        {qliroAvailable 
                          ? 'Bank, Kort och Qliro' 
                          : qliroStatusMessage || 'Tillfälligt otillgänglig'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pay at Location Option */}
                {canPayAtLocation && (
                  <div 
                    className={`border rounded-lg p-4 ${
                      (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone))
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer transition-colors'
                    } ${
                      selectedPaymentMethod === 'pay_at_location' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) {
                        showNotification('Kontaktuppgifter krävs', 'Fyll i dina kontaktuppgifter först', 'error');
                        return;
                      }
                      setSelectedPaymentMethod('pay_at_location');
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                        selectedPaymentMethod === 'pay_at_location' ? 'border-amber-500 bg-amber-500' : 'border-gray-400'
                      }`}>
                        {selectedPaymentMethod === 'pay_at_location' && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium">Betala på plats</p>
                        <p className="text-sm text-gray-500">Betalning vid lektionen</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unpaid Bookings Warning */}
                {showUnpaidWarning && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Obetald bokning</AlertTitle>
                    <AlertDescription>
                      Du har för tillfället {unpaidBookings} obetalda bokningar. 
                      Du måste betala dessa innan du kan boka fler lektioner.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Already Paid - Only for Admin/Teacher */}
              {isAdminOrTeacher && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="already-paid" 
                      checked={alreadyPaid} 
                      onCheckedChange={setAlreadyPaid}
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

            {/* Warnings for students */}
            {isStudent && (
              <div className="space-y-2">
                {!canUseCredits && (
                  <p className="text-xs text-gray-500">
                    Du har inga tillgängliga kreditpoäng för denna lektionstyp
                  </p>
                )}
                {!canPayAtLocation && (
                  <p className="text-xs text-red-500">
                    Betala på plats är inte tillgängligt - du har {unpaidBookings} obetalda bokningar
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={
                loading || 
                (isAdminOrTeacher && !selectedStudent) || 
                (!isAdminOrTeacher && !selectedPaymentMethod && !alreadyPaid) ||
                (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone))
              }
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 mb-4"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"></span>
                  Genomför bokning
                </span>
              ) : (
                "Bekräfta bokning"
              )}
            </Button>
            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Use the proper Swish Payment Dialog component */}
      <SwishPaymentDialog
        isOpen={showSwishDialog}
        onClose={() => setShowSwishDialog(false)}
        booking={{
          id: bookingData.tempBookingId || bookingData.id || (bookingData.isHandledarutbildning ? `handledar-${Date.now()}` : `temp-${Date.now()}`),
          totalPrice: bookingData.totalPrice
        }}
        bookingData={{
          lessonType: bookingData.lessonType,
          selectedDate: bookingData.selectedDate,
          selectedTime: bookingData.selectedTime,
          totalPrice: bookingData.totalPrice,
          guestName: isHandledarutbildning ? supervisorName : guestName,
          guestEmail: isHandledarutbildning ? supervisorEmail : guestEmail,
          guestPhone: isHandledarutbildning ? supervisorPhone : guestPhone,
          studentId: isAdminOrTeacher ? selectedStudent : undefined
        }}
        onConfirm={() => {
          setShowSwishDialog(false)
          // Redirect to confirmation page
          window.location.href = '/booking/success'
        }}
      />

      {/* Qliro Payment Dialog */}
      <QliroPaymentDialog
        isOpen={showQliroDialog}
        onClose={() => setShowQliroDialog(false)}
        purchaseId={`booking-${Date.now()}`}
        amount={bookingData.totalPrice}
        checkoutUrl={qliroCheckoutUrl}
        onConfirm={() => {
          setShowQliroDialog(false)
          // Redirect to confirmation page
          window.location.href = '/booking/success'
        }}
      />

      {/* Email Conflict Dialog */}
      <EmailConflictDialog
        isOpen={showEmailConflictDialog}
        onClose={() => setShowEmailConflictDialog(false)}
        existingEmail={conflictingEmail}
        onUseExistingAccount={handleUseExistingAccount}
        onUseNewEmail={handleUseNewEmail}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Add Student Dialog */}
      <AddStudentPopup
        isOpen={showAddStudentDialog}
        onClose={() => setShowAddStudentDialog(false)}
        onStudentAdded={handleStudentAdded}
      />
      </div>
    </>
  )
}
