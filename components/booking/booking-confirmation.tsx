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
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [qliroAvailable, setQliroAvailable] = useState<boolean>(true)
  const [qliroStatusMessage, setQliroStatusMessage] = useState<string>('')
  const [qliroStatusLoading, setQliroStatusLoading] = useState<boolean>(true)

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
  const isHandledarSession = isHandledarutbildning
  const finalTotalPrice = bookingData.totalPrice + (supervisorCount * pricePerSupervisor)
  const showUnpaidWarning = isStudent && unpaidBookings >= 2 && 
                          (selectedPaymentMethod === 'pay_at_location' || !selectedPaymentMethod)

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

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const formatLocalYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

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

<<<<<<< HEAD
=======
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
  const isTeoriSession = bookingData && bookingData.lessonType.type === 'teori'

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

>>>>>>> d644b24effef7818a618a594170f5b5091984a19
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
<<<<<<< HEAD
    setLoading(true)
    setShowLoader(true)
=======
    // Check capacity error first
    if (capacityError) {
      showNotification('Fel', 'Kan inte boka - otillräcklig kapacitet', 'error')
      return
    }

    // Validate handledare information if supervisors are added
    if (allowsSupervisors && supervisorCount > 0) {
      const incompleteDetails = supervisorDetails.slice(0, supervisorCount).some(
        (detail, index) => !detail?.name?.trim() || !detail?.email?.trim() || !detail?.phone?.trim() || !detail?.personnummer?.trim()
      )
      if (incompleteDetails) {
        showNotification('Fel', 'Vänligen fyll i personnummer, namn, e-post och telefonnummer för alla handledare', 'error')
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
        return
      }
    }

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
    const bookingPayload: any = {
      paymentMethod: selectedPaymentMethod,
      totalPrice: finalTotalPrice,
      lessonType: bookingData.lessonType,
      guestName: isHandledarutbildning ? supervisorName : guestName,
      guestEmail: isHandledarutbildning ? supervisorEmail : guestEmail,
      guestPhone: isHandledarutbildning ? supervisorPhone : guestPhone,
      studentId: isAdminOrTeacher ? selectedStudent : undefined,
      alreadyPaid: isAdminOrTeacher ? Boolean(alreadyPaid) : false,
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
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
    
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

<<<<<<< HEAD
  // Effects
=======
  const isHandledarSession = bookingData.lessonType.type === 'handledar' || bookingData.lessonType.type === 'teori'

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
  const allowsSupervisors = bookingData.lessonType.allowsSupervisors || false
  const pricePerSupervisor = bookingData.lessonType.pricePerSupervisor || 0
  const hasHandledarCredits = isHandledarutbildning && userCredits > 0
  const canUseCredits = (isStudent && userCredits > 0) || hasHandledarCredits
  const canPayAtLocation = isStudent && unpaidBookings < 2
  const requiresPersonalId = Boolean((bookingData as any)?.lessonType?.requiresPersonalId) || isHandledarSession
  
  // Calculate final price including handledare
  const finalTotalPrice = bookingData.totalPrice + (supervisorCount * pricePerSupervisor);

  // Validate capacity when supervisor count changes
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }
    }
  }, [emailCheckTimeout])

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
            if (fullName) setSupervisorName(fullName)
            if (s.email) setSupervisorEmail(String(s.email))
            if (s.phone) setSupervisorPhone(String(s.phone))
          }
        }
      }
    } catch {}
  }, [selectedStudent])

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
                  <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Välj en elev" className="text-gray-900 font-medium" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60 overflow-y-auto">
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id} className="text-gray-900 font-medium hover:bg-blue-50 focus:bg-blue-50 cursor-pointer py-2 px-3">
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

<<<<<<< HEAD
            {/* Supervisor Selection for lessons that allow supervisors */}
            {allowsSupervisors && !isHandledarSession && (
              <div className="bg-green-50 p-6 rounded-xl mb-6 border border-green-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Handledare</h3>
                <p className="text-sm text-gray-700 mb-4 font-medium">
                  Denna lektion tillåter handledare. Välj antal handledare som ska delta.
                </p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <Label className="text-sm font-medium text-gray-700">Antal handledare:</Label>
                  <div className="flex items-center space-x-2">
                    <Button
=======
            {/* Handledare Section */}
            {allowsSupervisors && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Handledare information
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isHandledarSession
                    ? `Du kan lägga till ytterligare handledare för ${pricePerSupervisor} kr per person utöver grundpriset.`
                    : `Du kan lägga till handledare för ${pricePerSupervisor} kr per person.`
                  }
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Antal handledare:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSupervisorCount(Math.max(0, supervisorCount - 1))}
                      disabled={supervisorCount <= 0}
                      className="w-8 h-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold">{supervisorCount}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSupervisorCount(supervisorCount + 1)}
                      className="w-8 h-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                  {pricePerSupervisor > 0 && (
                    <span className="text-sm text-gray-600">
                      ({pricePerSupervisor} kr per handledare)
                    </span>
                  )}
                </div>

                {supervisorCount > 0 && (
                  <div className="space-y-4">
<<<<<<< HEAD
                    <p className="text-sm text-gray-700 font-medium">
                      Fyll i information för alla handledare:
                    </p>
                    {Array.from({ length: supervisorCount }, (_, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Handledare {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Namn *</Label>
                            <Input
=======
                    {Array.from({ length: supervisorCount }, (_, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="text-md font-medium text-gray-800 mb-3">
                          Handledare {index + 1}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Personnummer */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Personnummer (ÅÅÅÅMMDD-XXXX) *
                            </label>
                            <input
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="ÅÅÅÅMMDD-XXXX"
                              required
                            />
                            {supervisorDetails[index]?.personnummer && (
                              <p className="text-xs text-gray-500 mt-1">
                                Visas som: {maskPersonnummer(supervisorDetails[index].personnummer)}
                              </p>
                            )}
                          </div>

                          {/* Namn */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Namn *
                            </label>
                            <input
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
                              type="text"
                              value={supervisorDetails[index]?.name || ''}
                              onChange={(e) => {
                                const newDetails = [...supervisorDetails];
<<<<<<< HEAD
                                newDetails[index] = { ...newDetails[index], name: e.target.value, phone: newDetails[index]?.phone || '' };
                                setSupervisorDetails(newDetails);
                              }}
                              placeholder="För- och efternamn"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Telefon *</Label>
                            <Input
=======
                                newDetails[index] = {
                                  ...newDetails[index],
                                  name: e.target.value
                                };
                                setSupervisorDetails(newDetails);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ange namn"
                              required
                            />
                          </div>

                          {/* E-post */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              E-post *
                            </label>
                            <input
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="johaswe@gmail.com"
                              required
                            />
                          </div>

                          {/* Telefon */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefon *
                            </label>
                            <input
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
                              type="tel"
                              value={supervisorDetails[index]?.phone || ''}
                              onChange={(e) => {
                                const newDetails = [...supervisorDetails];
<<<<<<< HEAD
                                newDetails[index] = { ...newDetails[index], name: newDetails[index]?.name || '', phone: e.target.value };
                                setSupervisorDetails(newDetails);
                              }}
                              placeholder="070-123 45 67"
                              className="mt-1"
=======
                                newDetails[index] = {
                                  ...newDetails[index],
                                  phone: e.target.value
                                };
                                setSupervisorDetails(newDetails);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0707123123"
                              required
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
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
<<<<<<< HEAD
              <div className="bg-amber-50 p-6 rounded-xl mb-6 border border-amber-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Dina kontaktuppgifter</h3>
                <p className="text-sm text-gray-700 mb-5 font-medium">
=======
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Dina kontaktuppgifter</h3>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => window.location.href = '/registrering'} className="px-3 py-1 rounded border border-purple-300 text-purple-700 bg-white hover:bg-purple-50">Skapa elev</button>
                    <button onClick={() => window.location.href = '/login'} className="px-3 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">Logga in</button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
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
<<<<<<< HEAD
=======
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
            {(requiresPersonalId) && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Handledare information</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="supervisor-ssn" className="text-sm font-medium text-gray-700">Personnummer (ÅÅÅÅMMDD-XXXX)</Label>
                    <Input
                      id="supervisor-ssn"
                      type="text"
                      inputMode="numeric"
                      value={supervisorSSN}
                      onChange={(e) => {
                        const raw = String(e.target.value || '')
                        const digits = raw.replace(/[^0-9]/g, '').slice(0, 12)
                        const formatted = digits.length <= 8 ? digits : `${digits.slice(0,8)}-${digits.slice(8,12)}`
                        setSupervisorSSN(formatted)
                      }}
                      placeholder="ÅÅÅÅMMDD-XXXX"
                      className="mt-1 font-mono"
                    />
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      Visas som: {(() => {
                        const digits = supervisorSSN.replace(/[^0-9]/g, '')
                        const head = digits.slice(0,8)
                        const tail = digits.slice(8,12)
                        const sep = digits.length > 8 ? '-' : ''
                        const masked = tail ? '••••' : ''
                        return `${head}${sep}${masked}`
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">Sista fyra maskeras (••••). Lagring sker krypterat.</p>
                  </div>
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
>>>>>>> d644b24effef7818a618a594170f5b5091984a19
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

            <Button
              onClick={handleSubmit}
              disabled={
                loading || 
                (isAdminOrTeacher && !selectedStudent) || 
                (!isAdminOrTeacher && !selectedPaymentMethod && !alreadyPaid) ||
                (!authUser && !isAdminOrTeacher && (!guestName || !guestEmail || !guestPhone))
              }
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 mb-4 mt-6"
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
          </CardContent>
        </Card>

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
