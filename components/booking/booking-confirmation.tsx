"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CreditCard, DollarSign, Loader2, User, Mail, Phone, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useAuthActions } from '@/hooks/useAuthActions'
import { toast, Toaster } from 'sonner'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import QRCode from 'qrcode'
import { SwishPaymentDialog } from './swish-payment-dialog'
import { QliroPaymentDialog } from './qliro-payment-dialog'
import { useQliroListener } from '@/hooks/use-qliro-listener'
import { EmailConflictDialog } from './email-conflict-dialog'

interface LessonType {
  id: string
  type?: 'lesson' | 'handledar'
  name: string
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
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
  const [students, setStudents] = useState<any[]>([])
  const [userCredits, setUserCredits] = useState<number>(0)
  const [unpaidBookings, setUnpaidBookings] = useState<number>(0)
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [supervisorPhone, setSupervisorPhone] = useState('')
  const [participantCount, setParticipantCount] = useState(1)
  const [maxParticipants, setMaxParticipants] = useState(1)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [showSwishDialog, setShowSwishDialog] = useState(false)
  const [showQliroDialog, setShowQliroDialog] = useState(false)
  const [qliroCheckoutUrl, setQliroCheckoutUrl] = useState('')
  const [showEmailConflictDialog, setShowEmailConflictDialog] = useState(false)
  const [conflictingEmail, setConflictingEmail] = useState('')
  const [emailValidationStatus, setEmailValidationStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle')
  const [existingUserName, setExistingUserName] = useState('')
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
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

  const handleSubmit = async () => {
    // Admin/Teacher validation first
    if (isAdminOrTeacher && !selectedStudent) {
      showNotification('Fel', 'Välj en elev för bokningen', 'error')
      return
    }

    // Check if admin has marked as already paid - if so, create booking directly for student
    if (isAdminOrTeacher && alreadyPaid) {
      setLoading(true)
      try {
        // Use the appropriate API endpoint based on user role
        const endpoint = user?.role === 'admin' ? '/api/admin/bookings/create-for-student' : '/api/teacher/bookings/create-for-student';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: selectedStudent,
            lessonTypeId: bookingData.lessonType.id,
            scheduledDate: formatLocalYmd(bookingData.selectedDate),
            startTime: bookingData.selectedTime,
            endTime: bookingData.selectedTime.split(':').slice(0, 2).join(':') + ':' + 
                    String(parseInt(bookingData.selectedTime.split(':')[1]) + bookingData.lessonType.durationMinutes).padStart(2, '0'),
            durationMinutes: bookingData.lessonType.durationMinutes,
            transmissionType: bookingData.transmissionType || 'manual',
            totalPrice: bookingData.totalPrice,
            paymentMethod: 'admin_created',
            paymentStatus: 'paid',
            status: 'confirmed',
            notes: `Bokad av ${user?.role === 'admin' ? 'administratör' : 'lärare'}`,
            // Handledar support when admin books
            sessionId: bookingData.sessionId,
            supervisorName: isHandledarutbildning ? supervisorName : undefined,
            supervisorEmail: isHandledarutbildning ? supervisorEmail : undefined,
            supervisorPhone: isHandledarutbildning ? supervisorPhone : undefined,
            useHandledarCredit: isHandledarutbildning ? (alreadyPaid === true) : false
          })
        })

        if (response.ok) {
          const result = await response.json()
          showNotification('Bokad!', 'Bokningen har skapats för eleven och bekräftelse har skickats', 'success')
          
          // Store booking details for success page
          localStorage.setItem('recentBooking', JSON.stringify({
            id: result.booking.id,
            lessonType: bookingData.lessonType.name,
            date: formatLocalYmd(bookingData.selectedDate),
            time: bookingData.selectedTime,
            duration: bookingData.lessonType.durationMinutes,
            price: bookingData.totalPrice,
            paymentMethod: 'admin_created',
            status: 'confirmed'
          }))
          
          // Redirect to success page
          window.location.href = '/booking/success'
          return
        } else {
          const error = await response.json()
          showNotification('Fel', error.error || 'Kunde inte skapa bokningen för eleven', 'error')
          return
        }
      } catch (error) {
        console.error('Booking creation error:', error)
        showNotification('Fel', 'Ett oväntat fel uppstod', 'error')
        return
      } finally {
        setLoading(false)
      }
    }

    // Regular flow - check payment method selection
    if (!selectedPaymentMethod) {
      showNotification('Välj betalningssätt', 'Vänligen välj ett betalningssätt för att fortsätta', 'error')
      return
    }

    // If no specific student is selected (guest flow), validate and update guest info
    const isGuestFlow = !isAdminOrTeacher || !selectedStudent
    if (isGuestFlow) {
      const gName = isHandledarutbildning ? supervisorName : guestName
      const gEmail = isHandledarutbildning ? supervisorEmail : guestEmail
      const gPhone = isHandledarutbildning ? supervisorPhone : guestPhone
      const missing: string[] = []
      if (!gName) missing.push('namn')
      if (!gEmail) missing.push('e-post')
      if (!gPhone) missing.push('telefon')
      if (missing.length > 0) {
        showNotification('Saknar uppgifter', `Vänligen fyll i ${missing.join(', ')}`, 'error')
        return
      }

      if (bookingData.bookingId || bookingData.tempBookingId) {
        try {
          const updateResponse = await fetch('/api/booking/update-guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: bookingData.bookingId || bookingData.tempBookingId,
              guestName: gName,
              guestEmail: gEmail,
              guestPhone: gPhone
            })
          })
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}))
            console.error('Failed to update guest information:', errorData.error)
            // Do not block payment if API rejects non-critical update
          }
        } catch (error) {
          console.error('Error updating guest information:', error)
        }
      }
    }

    // Prepare the base booking data
    const bookingPayload = {
      paymentMethod: selectedPaymentMethod,
      totalPrice: bookingData.totalPrice,
      lessonType: bookingData.lessonType,
      guestName: isHandledarutbildning ? supervisorName : guestName,
      guestEmail: isHandledarutbildning ? supervisorEmail : guestEmail,
      guestPhone: isHandledarutbildning ? supervisorPhone : guestPhone,
      studentId: isAdminOrTeacher ? selectedStudent : undefined,
      alreadyPaid: isAdminOrTeacher ? Boolean(alreadyPaid) : false
    }

  // Log selected payment method and booking data for troubleshooting (behind site debug flag)
  try {
    fetch('/api/public/site-settings').then(r=>r.json()).then(s=>{
      if (s?.debug_extended_logs) {
        console.debug('[BookingCheckout] Selected payment method:', selectedPaymentMethod)
        console.debug('[BookingCheckout] Booking data tempBookingId:', bookingData.tempBookingId)
        console.debug('[BookingCheckout] Booking data id:', bookingData.id)
        console.debug('[BookingCheckout] Full booking data:', bookingData)
      }
    }).catch(()=>{})
  } catch {}

    // Handle Swish payment
    if (selectedPaymentMethod === 'swish') {
      setShowSwishDialog(true)
      return
    }

    // Handle Qliro payment
    if (selectedPaymentMethod === 'qliro') {
      try {
        setLoading(true)
        
        console.log('[BOOKING DEBUG] Starting Qliro payment for booking:', bookingData.id || bookingData.tempBookingId);
        
        // Step 1 & 2: Create order via unified API (following Qliro docs)
        const response = await fetch('/api/payments/qliro/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingData.id || bookingData.tempBookingId
          })
        });
        
        if (!response.ok) throw new Error('Kunde inte skapa Qliro-checkout');
        
        const data = await response.json();
        console.log('[BOOKING DEBUG] Order created successfully:', {
          checkoutId: data.checkoutId,
          merchantReference: data.merchantReference
        });
        
        // Step 3, 4, 5: Use flow manager to handle checkout display
        const { QliroFlowManager } = await import('@/lib/payment/qliro-flow-manager');
        await QliroFlowManager.openQliroCheckout({
          orderId: String(data.checkoutId || data.checkoutId),
          amount: bookingData.totalPrice,
          description: `Körlektion ${bookingData.lessonType?.name || ''}`,
          checkoutUrl: data.checkoutUrl,
          onCompleted: () => {
            console.log('[BOOKING DEBUG] Payment completed, redirecting...');
            const id = bookingData.id || bookingData.tempBookingId;
            if (id) {
              window.location.href = `/qliro/return?ref=${encodeURIComponent(`booking_${id}`)}&status=paid`;
            }
          },
          onError: (error) => {
            console.error('[BOOKING DEBUG] Payment error:', error);
            showNotification('Betalningsfel', `Ett fel uppstod: ${error.message || 'Okänt fel'}`, 'error');
          }
        });
        
      } catch (error) {
        console.error('[BOOKING DEBUG] Qliro payment error:', error);
        showNotification('Ett fel uppstod', 'Kunde inte starta Qliro-checkout. Försök igen senare.', 'error');
      } finally {
        setLoading(false);
      }
      return
    }
    
    // Guest validation if not logged in
    if (!authUser && !isAdminOrTeacher) {
      if (!guestName || !guestEmail || !guestPhone) {
        showNotification('Information saknas', 'Vänligen fyll i alla kontaktuppgifter', 'error')
        return
      }
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(guestEmail)) {
        showNotification('Ogiltig e-postadress', 'Vänligen ange en giltig e-postadress', 'error')
        return
      }
    }
    

    // Validate supervisor information for handledar sessions when not admin/teacher
    if (isHandledarutbildning && !isAdminOrTeacher) {
      if (!supervisorName || !supervisorEmail || !supervisorPhone) {
        showNotification('Fel', 'Handledarinformation krävs för handledarutbildning', 'error')
        return
      }
    }

    // If using credits for handledarutbildning, ensure they have enough credits
    if (selectedPaymentMethod === 'credits' && isHandledarutbildning && userCredits < 1) {
      showNotification('Otillräckligt med krediter', 'Du har inte tillräckligt med krediter för denna handledarutbildning', 'error')
      return
    }

    const completionData = {
      paymentMethod: selectedPaymentMethod,
      studentId: isAdminOrTeacher ? selectedStudent : undefined,
      alreadyPaid: isAdminOrTeacher ? Boolean(alreadyPaid) : false,
      totalPrice: bookingData.totalPrice,
      lessonType: bookingData.lessonType,
      // Add supervisor information for handledar sessions
      ...(isHandledarutbildning && {
        guestName: supervisorName,
        guestEmail: supervisorEmail,
        guestPhone: supervisorPhone,
      }),
      // Add guest information if not logged in
      ...(!authUser && !isAdminOrTeacher && {
        guestName: guestName,
        guestEmail: guestEmail,
        guestPhone: guestPhone,
      }),
    }

    // Handle email conflict by showing dialog
    try {
      onComplete(completionData)
    } catch (error: any) {
      if (error?.userExists && error?.existingEmail) {
        setConflictingEmail(error.existingEmail)
        setShowEmailConflictDialog(true)
        return
      }
      throw error
    }
  }

  const handleUseExistingAccount = (e: React.MouseEvent) => {
    e.preventDefault()
    handleLogin(e, window.location.href)
  }

  const handleLoginSuccess = () => {
    // After successful login, close the dialog and continue with booking
    setShowEmailConflictDialog(false)
    // The page will reload automatically from the dialog component
  }

  const handleUseNewEmail = (newEmail: string) => {
    // Update the appropriate email field based on context
    if (isHandledarutbildning) {
      setSupervisorEmail(newEmail)
    } else {
      setGuestEmail(newEmail)
    }
    
    // Try submitting again with the new email
    setTimeout(() => {
      handleSubmit()
    }, 100)
  }

  const isHandledarSession = bookingData.lessonType.type === 'handledar'
  const hasHandledarCredits = isStudent && userCredits > 0 && isHandledarutbildning
  const canUseCredits = isStudent && userCredits > 0 && (bookingData.lessonType.type !== 'handledar' || isHandledarutbildning)
  const canPayAtLocation = isStudent && unpaidBookings < 2 && bookingData.lessonType.type !== 'handledar'

  // Create Swish logo SVG component
  const SwishLogo = () => (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FF5722"/>
      <path d="M25 35h50c5.5 0 10 4.5 10 10v10c0 5.5-4.5 10-10 10H25c-5.5 0-10-4.5-10-10V45c0-5.5 4.5-10 10-10z" fill="white"/>
      <text x="50" y="55" textAnchor="middle" fill="#FF5722" fontSize="16" fontWeight="bold">S</text>
    </svg>
  )

  // Define payment method options
  const paymentMethods = React.useMemo(() => {
    const isHandledar = bookingData.lessonType?.name === 'Handledarutbildning' || 
                       bookingData.lessonType?.name?.toLowerCase().includes('handledarutbildning')
    
    return [
      {
        id: 'swish',
        label: 'Swish',
        description: 'Betala direkt med Swish',
        icon: <SwishLogo />,
        available: true
      },
      {
        id: 'qliro',
        label: 'Qliro',
        description: qliroAvailable 
          ? 'Bank, Kort och Qliro' 
          : qliroStatusMessage || 'Tillfälligt otillgänglig',
        icon: <CreditCard className="w-5 h-5 text-purple-600" />,
        available: isHandledar && qliroAvailable
      },
      {
        id: 'credits',
        label: 'Använd mina krediter',
        description: isHandledar
          ? `Använd ${userCredits} kredit${userCredits > 1 ? 'er' : ''} för denna handledarutbildning`
          : `Du har ${userCredits} kredit${userCredits !== 1 ? 'er' : ''} kvar`,
        icon: <CreditCard className="w-5 h-5 text-blue-600" />,
        available: isStudent && userCredits > 0 && (isHandledar || bookingData.lessonType?.id)
      },
      {
        id: 'pay_at_location',
        label: 'Betala på plats',
        description: 'Betalning vid lektionen',
        icon: <DollarSign className="w-5 h-5 text-amber-600" />,
        available: isStudent && unpaidBookings < 2
      }
    ].filter(method => method.available)
  }, [bookingData.lessonType, isStudent, userCredits, unpaidBookings])

  // Show warning if user has too many unpaid bookings
  const showUnpaidWarning = isStudent && unpaidBookings >= 2 && 
                          (selectedPaymentMethod === 'pay_at_location' || !selectedPaymentMethod);

  return (
    <div className="relative">
      <Toaster position="top-right" richColors />
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bekräfta bokning</h2>
            <p className="text-lg text-gray-600">
              {isAdminOrTeacher ? 'Boka lektion för elev och välj betalningsmetod' : 'Granska din bokning och välj betalningsmetod'}
            </p>
            
            {/* Student Selection for Admin/Teacher */}
            {isAdminOrTeacher && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <Label htmlFor="student-select" className="text-sm font-medium text-gray-700 mb-2 block">
                  Välj elev för bokningen *
                </Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en elev..." />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg">
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span>{isHandledarSession ? 'Session:' : 'Lektion:'}</span>
                <span>{bookingData.lessonType.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Varaktighet:</span>
                <span>{bookingData.lessonType.durationMinutes} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Datum:</span>
                <span>{bookingData.selectedDate.toLocaleDateString('sv-SE')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tid:</span>
                <span>{bookingData.selectedTime}</span>
              </div>
              {!isHandledarSession && (
                <div className="flex items-center justify-between">
                  <span>Växellåda:</span>
                  <span>{bookingData.transmissionType === 'manual' ? 'Manuell' : 'Automat'}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-semibold">
                <span>Kurspris:</span>
                <span>{bookingData.totalPrice} kr</span>
              </div>
            </div>

            {/* Guest Information for non-logged-in users */}
            {!authUser && !isAdminOrTeacher && !isHandledarSession && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Dina kontaktuppgifter</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vi behöver dina kontaktuppgifter för att skapa ett konto och skicka bokningsbekräftelse.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="guest-name" className="text-sm font-medium text-gray-700">Namn *</Label>
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
    </div>
  )
}
