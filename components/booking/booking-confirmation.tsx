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
  const [supervisorDetails, setSupervisorDetails] = useState<Array<{ name: string; phone: string }>>([])
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

  // Effects
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
                              type="text"
                              value={supervisorDetails[index]?.name || ''}
                              onChange={(e) => {
                                const newDetails = [...supervisorDetails];
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
                              type="tel"
                              value={supervisorDetails[index]?.phone || ''}
                              onChange={(e) => {
                                const newDetails = [...supervisorDetails];
                                newDetails[index] = { ...newDetails[index], name: newDetails[index]?.name || '', phone: e.target.value };
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
