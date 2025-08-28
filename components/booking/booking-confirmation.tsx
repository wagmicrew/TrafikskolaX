"use client";

import React, { useState, useEffect } from 'react'
import {
  Card as FBCard,
  Button as FBButton,
  Label as FBLabel,
  TextInput,
  Select as FBSelect,
  Checkbox as FBCheckbox,
  FloatingLabel,
} from 'flowbite-react'
import { AlertCircle, Loader2, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react'
import { OrbLoader } from '@/components/ui/orb-loader'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast, Toaster } from 'sonner'
import { SwishPaymentDialog } from './swish-payment-dialog'
import { QliroPaymentDialog } from './qliro-payment-dialog'
import { useQliroListener } from '@/hooks/use-qliro-listener'
import { EmailConflictDialog } from './email-conflict-dialog'
import { AddStudentPopup } from './add-student-popup'
import { getErrorMessage } from '@/utils/getErrorMessage'

interface LessonType {
  id: string
  type?: 'lesson' | 'handledar' | 'teori'
  name: string
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  allowsSupervisors?: boolean
  pricePerSupervisor?: number
  maxParticipants?: number
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
  [key: string]: any
  bookingId?: string
  tempBookingId?: string
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
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [supervisorPhone, setSupervisorPhone] = useState('')
  const [supervisorCount, setSupervisorCount] = useState(0)
  const [supervisorDetails, setSupervisorDetails] = useState<Array<{ name: string; email: string; phone: string; personnummer: string }>>([])
  const [supervisorSSN, setSupervisorSSN] = useState('')
  const [capacityError, setCapacityError] = useState<string | null>(null)
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
  const [qliroAvailable, setQliroAvailable] = useState<boolean>(true)
  const [qliroStatusMessage, setQliroStatusMessage] = useState<string>('')
  const [qliroStatusLoading, setQliroStatusLoading] = useState<boolean>(true)
  
  // Inline auth state
  const [showLoginCard, setShowLoginCard] = useState(false)
  const [showRegisterCard, setShowRegisterCard] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [registerFirstName, setRegisterFirstName] = useState('')
  const [registerLastName, setRegisterLastName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPersonalNumber, setRegisterPersonalNumber] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [guestPersonalNumber, setGuestPersonalNumber] = useState('')

  const { user: authUser } = useAuth()

  useQliroListener({
    onCompleted: () => {
      const id = bookingData.id || bookingData.tempBookingId
      if (id) try { window.location.href = `/qliro/return?ref=${encodeURIComponent(`booking_${id}`)}&status=paid` } catch {}
    },
    onDeclined: () => {
      showNotification('Betalning nekades', 'Försök igen eller välj en annan metod', 'error')
    }
  })

  // Computed values
  const isAdminOrTeacher = authUser?.role === 'admin' || authUser?.role === 'teacher'
  const isStudent = authUser?.role === 'student'
  const isHandledarutbildning = bookingData && (bookingData.lessonType.name === 'Handledarutbildning' ||
                              bookingData.lessonType.name.toLowerCase().includes('handledarutbildning'))
  const hasHandledarCredits = userCredits > 0 && bookingData.isHandledarutbildning
  const canUseCredits = isStudent && userCredits > 0 && (isHandledarutbildning || bookingData.lessonType?.id)
  const canPayAtLocation = isStudent && unpaidBookings < 2
  const allowsSupervisors = bookingData.lessonType?.allowsSupervisors || false
  const pricePerSupervisor = bookingData.lessonType?.pricePerSupervisor || 0
  // Unified theoretical lesson detection
  const isTheoreticalLesson = bookingData.lessonType?.type === 'teori' || bookingData.lessonType?.type === 'handledar'
  const isHandledarSession = allowsSupervisors || isHandledarutbildning || bookingData.lessonType?.type === 'handledar'
  const requiresPersonalId = Boolean((bookingData as any)?.lessonType?.requiresPersonalId) || isHandledarSession
  // New pricing model: base price includes 1 student + 1 supervisor
  // Only charge for additional supervisors beyond the first
  const extraSupervisors = Math.max(0, supervisorCount - 1)
  const finalTotalPrice = bookingData.totalPrice + (extraSupervisors * pricePerSupervisor)
  const showUnpaidWarning = isStudent && unpaidBookings >= 2 && 
                          (selectedPaymentMethod === 'pay_at_location' || !selectedPaymentMethod)

  // Inline auth handlers
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return
    
    setIsLoggingIn(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success('Inloggad!')
        // Reload to get updated auth state
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Inloggning misslyckades')
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid inloggning')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleRegister = async () => {
    if (!registerFirstName || !registerLastName || !registerEmail || !registerPhone || !registerPersonalNumber) return
    
    setIsRegistering(true)
    try {
      // Generate secure password
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registerFirstName,
          lastName: registerLastName,
          email: registerEmail,
          phone: registerPhone,
          personalNumber: registerPersonalNumber,
          password: tempPassword,
          role: 'student',
          sendWelcomeEmail: true
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success('Konto skapat! Inloggningsuppgifter skickas till din e-post.')
        
        // Auto-login the new user
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: registerEmail, password: tempPassword })
        })
        
        if (loginResponse.ok) {
          window.location.reload()
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Registrering misslyckades')
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid registrering')
    } finally {
      setIsRegistering(false)
    }
  }

  // Helper functions
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Ensure we always clear loading states on early exits
  const stopLoading = () => {
    setLoading(false)
    setShowLoader(false)
  }

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const formatLocalYmd = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) {
      console.error('Invalid date in formatLocalYmd:', d);
      return 'Ogiltigt datum';
    }
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  const handleUseExistingAccount = () => {
    setShowEmailConflictDialog(false)
  }

  const handleUseNewEmail = () => {
    setShowEmailConflictDialog(false)
  }

  const handleLoginSuccess = () => {
    setShowEmailConflictDialog(false)
  }

  const handleStudentAdded = () => {
    setShowAddStudentDialog(false)
    fetchStudents()
  }

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

  const handleEmailChange = (email: string, isGuestEmail: boolean = true) => {
    if (isGuestEmail) {
      setGuestEmail(email)
    } else {
      setSupervisorEmail(email)
    }

    if (!authUser && validateEmail(email)) {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }

      const timeout = setTimeout(() => {
        checkEmailExists(email)
      }, 800)

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
      let response;
      if (isHandledarutbildning) {
        response = await fetch('/api/user/credits?creditType=handledar')
      } else {
        response = await fetch(`/api/user/credits?lessonTypeId=${bookingData.lessonType.id}`)
      }
      
      if (response.ok) {
        const data = await response.json()
        if (isHandledarutbildning && data.credits) {
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
    setLoading(true)
    setShowLoader(true)
    
    // Check capacity error first
    if (capacityError) {
      showNotification('Fel', 'Kan inte boka - otillräcklig kapacitet', 'error')
      stopLoading()
      return
    }

    // Validate handledare information if supervisors are added
    if (allowsSupervisors && supervisorCount > 0) {
      const incompleteDetails = supervisorDetails.slice(0, supervisorCount).some(
        (detail, index) => !detail?.name?.trim() || !detail?.email?.trim() || !detail?.phone?.trim() || !detail?.personnummer?.trim()
      )
      if (incompleteDetails) {
        showNotification('Fel', 'Vänligen fyll i personnummer, namn, e-post och telefonnummer för alla handledare', 'error')
        stopLoading()
        return
      }

      // Validate personnummer format (should be 12 digits)
      const invalidPersonnummer = supervisorDetails.slice(0, supervisorCount).some(
        (detail) => {
          const cleanNumber = detail?.personnummer?.replace(/-/g, '') || '';
          return cleanNumber.length !== 12;
        }
      )
      if (invalidPersonnummer) {
        showNotification('Fel', 'Personnummer måste vara 12 siffror (ÅÅÅÅMMDDXXXX)', 'error')
        stopLoading()
        return
      }
    }

    // Admin/Teacher validation first
    if (isAdminOrTeacher && !selectedStudent) {
      showNotification('Fel', 'Välj en elev för bokningen', 'error')
      stopLoading()
      return
    }

    // Check if admin has marked as already paid - if so, create booking directly for student
    if (isAdminOrTeacher && alreadyPaid === true) {
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
                    (() => {
                      const parts = (bookingData.selectedTime || '00:00').split(':')
                      const sh = parseInt(parts[0], 10) || 0
                      const sm = parseInt(parts[1], 10) || 0
                      const total = sh * 60 + sm + (bookingData.lessonType?.durationMinutes || 0)
                      const eh = Math.floor(total / 60) % 24
                      const em = total % 60
                      return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
                    })(),
            durationMinutes: bookingData.lessonType.durationMinutes,
            transmissionType: bookingData.transmissionType || 'manual',
            totalPrice: finalTotalPrice,
            paymentMethod: 'admin_created',
            paymentStatus: 'paid',
            status: 'confirmed',
            notes: `Bokad av ${user?.role === 'admin' ? 'administratör' : 'lärare'}`,
            // Handledar support when admin books
            sessionId: bookingData.sessionId,
            supervisorName: isHandledarutbildning ? supervisorName : undefined,
            supervisorEmail: isHandledarutbildning ? supervisorEmail : undefined,
            supervisorPhone: isHandledarutbildning ? supervisorPhone : undefined,
            useHandledarCredit: isHandledarutbildning ? (alreadyPaid === true) : false,
            // Handledare support for regular lessons
            supervisorCount: allowsSupervisors ? supervisorCount : undefined,
            supervisorDetails: allowsSupervisors && supervisorCount > 0 ? supervisorDetails.slice(0, supervisorCount) : undefined
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
            price: finalTotalPrice,
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
      stopLoading()
      return
    }

    // Additional payment-specific validations
    if (selectedPaymentMethod === 'pay_at_location' && !canPayAtLocation) {
      showNotification('Inte tillgängligt', 'Betalning på plats är inte tillåten eftersom du har för många obetalda bokningar', 'error')
      setLoading(false)
      setShowLoader(false)
      return
    }

    if (selectedPaymentMethod === 'credits' && !canUseCredits) {
      showNotification('Inga krediter', 'Du har inte tillräckliga krediter för denna bokning', 'error')
      setLoading(false)
      setShowLoader(false)
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
        stopLoading()
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
    const bookingPayload: any = {
      paymentMethod: selectedPaymentMethod,
      totalPrice: finalTotalPrice,
      lessonType: bookingData.lessonType,
      guestName: isHandledarutbildning ? supervisorName : guestName,
      guestEmail: isHandledarutbildning ? supervisorEmail : guestEmail,
      guestPhone: isHandledarutbildning ? supervisorPhone : guestPhone,
      studentId: isAdminOrTeacher ? selectedStudent : undefined,
      alreadyPaid: isAdminOrTeacher ? (alreadyPaid === true) : false,
      // Handledare support for regular lessons
      supervisorCount: allowsSupervisors ? supervisorCount : undefined,
      supervisorDetails: allowsSupervisors && supervisorCount > 0 ? supervisorDetails.slice(0, supervisorCount) : undefined
    }

    // Add personal number for sessions that require it
    if (requiresPersonalId && supervisorSSN.trim()) {
      bookingPayload.personalId = supervisorSSN.trim()
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
          amount: finalTotalPrice,
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
            showNotification('Betalningsfel', `Ett fel uppstod: ${getErrorMessage(error, 'Okänt fel')}` , 'error');
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
    
    try {
      if (capacityError) {
        showNotification('Fel', 'Kan inte boka - otillräcklig kapacitet', 'error')
        return
      }

      if (!selectedPaymentMethod && !alreadyPaid) {
        showNotification('Välj betalningssätt', 'Vänligen välj ett betalningssätt för att fortsätta', 'error')
        return
      }

      if (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone)) {
        showNotification('Kontaktuppgifter krävs', 'Fyll i alla kontaktuppgifter', 'error')
        return
      }

      if (isHandledarSession && (!supervisorName || !supervisorEmail || !supervisorPhone)) {
        showNotification('Handledare information krävs', 'Fyll i alla handledare uppgifter', 'error')
        return
      }

      // For handledar sessions, ensure at least one supervisor
      if (allowsSupervisors && supervisorCount < 1) {
        showNotification('Handledare krävs', 'Minst en handledare måste registreras för denna lektionstyp', 'error')
        return
      }

      if (supervisorCount > 0 && supervisorDetails.length < supervisorCount) {
        showNotification('Handledare information krävs', 'Fyll i information för alla handledare', 'error')
        return
      }

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

  // Function to mask personnummer
  const maskPersonnummer = (personnummer: string) => {
    if (!personnummer || personnummer.length < 8) return personnummer;

    // Remove any existing hyphens and get clean number
    const cleanNumber = personnummer.replace(/-/g, '');

    if (cleanNumber.length >= 8) {
      const firstPart = cleanNumber.slice(0, 8);
      const lastPart = cleanNumber.slice(8);
      const maskedLastPart = lastPart ? '••••' : '';
      return `${firstPart}${lastPart ? '-' : ''}${maskedLastPart}`;
    }

    return personnummer;
  };
  

  return (
    <>
      <OrbLoader isVisible={showLoader} text="Laddar..." />
      <div className="relative bg-white min-h-screen">
        <Toaster position="top-right" richColors />
        <FBCard className="w-full max-w-2xl mx-auto bg-white shadow-lg border border-gray-100">
          <div className="p-8">
            <div className="text-center mb-6">
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

                {/* Student Selection for Admin/Teacher - Integrated into summary */}
                {isAdminOrTeacher && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Elev:</span>
                        <div className="flex-1 ml-4 max-w-xs">
                          <FBSelect
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent((e.target as HTMLSelectElement).value)}
                            className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 text-sm"
                            required
                          >
                            <option value="" disabled>Välj elev</option>
                            {students.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.firstName} {student.lastName}
                              </option>
                            ))}
                          </FBSelect>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <FBButton
                          onClick={() => setShowAddStudentDialog(true)}
                          color="light"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Lägg till elev
                        </FBButton>
                      </div>
                    </div>
                  </div>
                )}

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



            {/* Supervisor Selection for lessons that allow supervisors */}
            {allowsSupervisors && (
              <div className="bg-blue-50 p-6 rounded-xl mb-6 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Handledare</h3>
                <p className="text-sm text-gray-800 mb-4 font-medium">
                  Grundpriset inkluderar en student och en handledare.
                  Du kan lägga till ytterligare handledare för {pricePerSupervisor} kr per person.
                </p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <FBLabel className="text-sm font-medium text-gray-800">Antal handledare:</FBLabel>
                  <div className="flex items-center space-x-2">
                    <FBButton
                      type="button"
                      color="light"
                      onClick={() => setSupervisorCount(Math.max(0, supervisorCount - 1))}
                      disabled={supervisorCount <= 0}
                      className="w-8 h-8 p-0"
                    >
                      -
                    </FBButton>
                    <span className="w-8 text-center font-semibold">{supervisorCount}</span>
                    <FBButton
                      type="button"
                      color="light"
                      onClick={() => setSupervisorCount(supervisorCount + 1)}
                      className="w-8 h-8 p-0"
                    >
                      +
                    </FBButton>
                  </div>
                  {pricePerSupervisor > 0 && (
                    <span className="text-sm text-gray-600">
                      ({pricePerSupervisor} kr per handledare)
                    </span>
                  )}
                </div>

                {supervisorCount > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 font-medium">
                      Fyll i information för alla handledare:
                    </p>
                    {Array.from({ length: supervisorCount }, (_, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Handledare {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Personnummer */}
                          <div>
                            <FloatingLabel
                              variant="filled"
                              label="Personnummer (ÅÅÅÅMMDD-XXXX) *"
                              type="text"
                              value={supervisorDetails[index]?.personnummer || ''}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                if (value.length > 12) value = value.slice(0, 12); // Max 12 digits

                                // Format as ÅÅÅÅMMDD-XXXX
                                if (value.length >= 8) {
                                  value = value.slice(0, 8) + '-' + value.slice(8);
                                }

                                const newDetails = [...supervisorDetails];
                                newDetails[index] = {
                                  ...newDetails[index],
                                  personnummer: value
                                };
                                setSupervisorDetails(newDetails);
                              }}
                              placeholder="ÅÅÅÅMMDD-XXXX"
                            />
                            {supervisorDetails[index]?.personnummer && (
                              <p className="text-xs text-gray-500 mt-1">
                                Visas som: {maskPersonnummer(supervisorDetails[index].personnummer)}
                              </p>
                            )}
                          </div>

                          {/* Namn */}
                          <div>
                            <FBLabel className="text-sm font-medium text-gray-700">Namn *</FBLabel>
                            <TextInput
                              type="text"
                              value={supervisorDetails[index]?.name || ''}
                              onChange={(e) => {
                                const newDetails = [...supervisorDetails];
                                newDetails[index] = {
                                  ...newDetails[index],
                                  name: e.target.value
                                };
                                setSupervisorDetails(newDetails);
                              }}
                              placeholder="För- och efternamn"
                              className="mt-1"
                            />
                          </div>

                          {/* E-post */}
                          <div>
                            <FBLabel className="text-sm font-medium text-gray-700">E-post *</FBLabel>
                            <TextInput
                              type="email"
                              value={supervisorDetails[index]?.email || ''}
                              onChange={(e) => {
                                const newDetails = [...supervisorDetails];
                                newDetails[index] = {
                                  ...newDetails[index],
                                  email: e.target.value
                                };
                                setSupervisorDetails(newDetails);
                              }}
                              placeholder="exempel@email.com"
                              className="mt-1"
                            />
                          </div>

                          {/* Telefon */}
                          <div>
                            <FBLabel className="text-sm font-medium text-gray-700">Telefon *</FBLabel>
                            <TextInput
                              type="tel"
                              value={supervisorDetails[index]?.phone || ''}
                              onChange={(e) => {
                                const newDetails = [...supervisorDetails];
                                newDetails[index] = {
                                  ...newDetails[index],
                                  phone: e.target.value
                                };
                                setSupervisorDetails(newDetails);
                              }}
                              placeholder="070-123 45 67"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Guest Information for non-logged-in users */}
            {!authUser && !isAdminOrTeacher && !isHandledarSession && (
              <div className="bg-white p-6 rounded-xl mb-6 border border-gray-200">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Dina kontaktuppgifter</h3>
                  <p className="text-sm text-gray-600">
                    Vi behöver dina kontaktuppgifter för att skapa ett konto och skicka bokningsbekräftelse.
                  </p>
                </div>
                
                {/* Inline Auth Options */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Login Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">1. Logga in</h4>
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">Har du redan ett konto?</p>
                    <button 
                      onClick={() => setShowLoginCard(!showLoginCard)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      {showLoginCard ? 'Dölj inloggning' : 'Logga in här'}
                    </button>
                  </div>
                  
                  {/* Register Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 backdrop-blur-sm border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-900">2. Skapa konto</h4>
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    </div>
                    <p className="text-sm text-purple-700 mb-3">Ny hos oss? Skapa konto direkt</p>
                    <button 
                      onClick={() => setShowRegisterCard(!showRegisterCard)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      {showRegisterCard ? 'Dölj registrering' : 'Skapa konto här'}
                    </button>
                  </div>
                </div>

                {/* Login Form Card */}
                {showLoginCard && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-4">Logga in på ditt konto</h4>
                    <div className="space-y-4">
                      <input
                        type="email"
                        placeholder="E-post"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="password"
                        placeholder="Lösenord"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleLogin}
                        disabled={!loginEmail || !loginPassword || isLoggingIn}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoggingIn ? 'Loggar in...' : 'Logga in'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Register Form Card */}
                {showRegisterCard && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-4">Skapa nytt konto</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Förnamn"
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Efternamn"
                          value={registerLastName}
                          onChange={(e) => setRegisterLastName(e.target.value)}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <input
                        type="email"
                        placeholder="E-post"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="tel"
                        placeholder="Telefon"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Personnummer (ÅÅÅÅMMDD-XXXX)"
                        value={registerPersonalNumber}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 12) value = value.slice(0, 12);
                          if (value.length >= 8) {
                            value = value.slice(0, 8) + '-' + value.slice(8);
                          }
                          setRegisterPersonalNumber(value);
                        }}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleRegister}
                        disabled={!registerFirstName || !registerLastName || !registerEmail || !registerPhone || !registerPersonalNumber || isRegistering}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isRegistering ? 'Skapar konto...' : 'Skapa konto'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Guest booking form - only show if not logged in and no auth cards are shown */}
                {!showLoginCard && !showRegisterCard && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Eller fortsätt som gäst</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Förnamn"
                          value={guestName.split(' ')[0] || ''}
                          onChange={(e) => {
                            const lastName = guestName.split(' ').slice(1).join(' ')
                            setGuestName(e.target.value + (lastName ? ' ' + lastName : ''))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Efternamn"
                          value={guestName.split(' ').slice(1).join(' ') || ''}
                          onChange={(e) => {
                            const firstName = guestName.split(' ')[0] || ''
                            setGuestName(firstName + (e.target.value ? ' ' + e.target.value : ''))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="E-post"
                            value={guestEmail}
                            onChange={(e) => handleEmailChange(e.target.value, true)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              emailValidationStatus === 'checking' ? 'border-yellow-400' :
                              emailValidationStatus === 'exists' ? 'border-red-400' :
                              emailValidationStatus === 'available' ? 'border-green-400' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {emailValidationStatus === 'available' && (
                          <p className="text-xs text-green-600 mt-1">E-postadressen är tillgänglig</p>
                        )}
                        {emailValidationStatus === 'exists' && (
                          <p className="text-xs text-red-600 mt-1">E-postadressen är redan registrerad</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Telefon"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Personnummer (ÅÅÅÅMMDD-XXXX)"
                          value={guestPersonalNumber}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length > 12) value = value.slice(0, 12);
                            if (value.length >= 8) {
                              value = value.slice(0, 8) + '-' + value.slice(8);
                            }
                            setGuestPersonalNumber(value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-4 p-3 bg-blue-100 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>OBS!</strong> Ett konto kommer att skapas med dessa uppgifter. 
                    Inloggningsuppgifter skickas till din e-post tillsammans med bokningsbekräftelsen.
                  </p>
                </div>
              </div>
            )}


            

            {/* Payment Methods */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Välj betalningsmetod</h3>
              
              {/* Swish Option */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'swish' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
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

              {/* Qliro Option */}
              <div
                className={`border rounded-lg p-4 transition-colors ${
                  selectedPaymentMethod === 'qliro'
                    ? 'border-blue-500 bg-blue-50'
                    : qliroAvailable
                      ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      : 'border-gray-200 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (qliroAvailable) setSelectedPaymentMethod('qliro')
                }}
                aria-disabled={!qliroAvailable}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                    selectedPaymentMethod === 'qliro' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                  }`}>
                    {selectedPaymentMethod === 'qliro' && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium">Qliro</p>
                    {qliroStatusLoading ? (
                      <p className="text-sm text-gray-500">Kontrollerar tillgänglighet...</p>
                    ) : (
                      qliroAvailable ? (
                        <p className="text-sm text-gray-500">Faktura eller delbetalning via Qliro</p>
                      ) : (
                        <p className="text-sm text-red-600">Inte tillgängligt just nu</p>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Credits Option (students) */}
              {isStudent && (
                <div
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedPaymentMethod === 'credits'
                      ? 'border-purple-500 bg-purple-50'
                      : canUseCredits
                        ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        : 'border-gray-200 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (canUseCredits) setSelectedPaymentMethod('credits')
                  }}
                  aria-disabled={!canUseCredits}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      selectedPaymentMethod === 'credits' ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                    }`}>
                      {selectedPaymentMethod === 'credits' && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium">Använd krediter</p>
                      <p className={`text-sm ${userCredits > 0 ? 'text-gray-500' : 'text-red-600'}`}>
                        {userCredits > 0 ? `Tillgängliga krediter: ${userCredits}` : 'Inga krediter tillgängliga'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pay at location Option (students) */}
              {isStudent && (
                <div
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedPaymentMethod === 'pay_at_location'
                      ? 'border-amber-500 bg-amber-50'
                      : canPayAtLocation
                        ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        : 'border-gray-200 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (!canPayAtLocation) {
                      showNotification('Inte tillgängligt', 'Du har fler än 1 obetald bokning. Välj annat betalningssätt.', 'warning')
                      return
                    }
                    setSelectedPaymentMethod('pay_at_location')
                  }}
                  aria-disabled={!canPayAtLocation}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      selectedPaymentMethod === 'pay_at_location' ? 'border-amber-500 bg-amber-500' : 'border-gray-400'
                    }`}>
                      {selectedPaymentMethod === 'pay_at_location' && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium">Betala på plats</p>
                      <p className={`text-sm ${canPayAtLocation ? 'text-gray-500' : 'text-red-600'}`}>
                        {canPayAtLocation
                          ? 'Betala när du kommer till trafikskolan'
                          : `Inte tillåtet: du har ${unpaidBookings} obetalda bokningar`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unpaid warning */}
              {showUnpaidWarning && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Du har {unpaidBookings} obetalda bokningar.</p>
                    <p>Betalning på plats är inte tillåten. Välj ett annat betalningssätt.</p>
                  </div>
                </div>
              )}

              {/* Already Paid - Only for Admin/Teacher */}
              {isAdminOrTeacher && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <FBCheckbox 
                      id="already-paid" 
                      checked={!!alreadyPaid} 
                      onChange={(e) => setAlreadyPaid(e.target.checked)}
                    />
                    <FBLabel htmlFor="already-paid" className="text-sm font-medium">
                      Eleven har redan betalat (bekräftad betalning)
                    </FBLabel>
                  </div>
                  {alreadyPaid && (
                    <p className="text-xs text-green-600 mt-2">
                      Bokningen kommer att markeras som bekräftad och betald
                    </p>
                  )}
                </div>
              )}
            </div>

            <FBButton
              onClick={handleSubmit}
              disabled={
                loading || 
                (isAdminOrTeacher && !selectedStudent) || 
                (!isAdminOrTeacher && !selectedPaymentMethod && !alreadyPaid) ||
                (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone))
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 mb-4 mt-6"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"></span>
                  Genomför bokning
                </span>
              ) : (
                "Bekräfta bokning"
              )}
            </FBButton>
            <FBButton color="light" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </FBButton>
          </div>
        </FBCard>

        {/* Dialogs */}
        <SwishPaymentDialog
          isOpen={showSwishDialog}
          onClose={() => setShowSwishDialog(false)}
          booking={{
            id: bookingData.tempBookingId || bookingData.id || `temp-${Date.now()}`,
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
            window.location.href = '/booking/success'
          }}
        />

        <QliroPaymentDialog
          isOpen={showQliroDialog}
          onClose={() => setShowQliroDialog(false)}
          purchaseId={`booking-${Date.now()}`}
          amount={bookingData.totalPrice}
          checkoutUrl={qliroCheckoutUrl}
          onConfirm={() => {
            setShowQliroDialog(false)
            window.location.href = '/booking/success'
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
      </div>
    </>
  )
}
