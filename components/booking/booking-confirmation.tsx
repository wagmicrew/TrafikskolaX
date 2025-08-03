"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React, { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, DollarSign, List, User, CreditCard, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface BookingData {
  lessonType: {
    id: string
    type?: 'lesson' | 'handledar'
    name: string
    durationMinutes: number
    price: number
    priceStudent?: number
    salePrice?: number
  }
  transmissionType?: "manual" | "automatic" | null
  selectedDate: Date
  selectedTime: string
  totalPrice: number
  [key: string]: any // Allow additional properties
}

interface BookingCompletionData {
  paymentMethod: string
  totalPrice: number
  lessonType: {
    id: string
    name: string
    durationMinutes: number
    price: number
    priceStudent?: number
    salePrice?: number
    type?: 'lesson' | 'handledar'
  }
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  studentId?: string
  alreadyPaid?: boolean
}

interface BookingConfirmationProps {
  bookingData: BookingData
  user: any
  onComplete: (data: BookingCompletionData) => void
  paymentMethod: string
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
  const { user: authUser } = useAuth()
  const { toast } = useToast()

  const isAdminOrTeacher = authUser?.role === 'admin' || authUser?.role === 'teacher'
  const isStudent = authUser?.role === 'student'
  const isGuest = !authUser
  const isHandledarutbildning = bookingData?.lessonType?.name === 'Handledarutbildning' || 
                              bookingData?.lessonType?.name?.toLowerCase().includes('handledarutbildning')

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
      const response = await fetch('/api/admin/students')
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
    // Skip payment method check if admin is booking and has marked as already paid
    if (isAdminOrTeacher && alreadyPaid) {
      setSelectedPaymentMethod('already_paid')
    } else if (!selectedPaymentMethod) {
      toast({
        title: "Välj betalningssätt",
        description: "Vänligen välj ett betalningssätt för att fortsätta",
        variant: "destructive",
      })
      return
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
      alreadyPaid: isAdminOrTeacher ? !!alreadyPaid : false
    }

    // Handle Swish payment
    if (selectedPaymentMethod === 'swish') {
      setShowSwishDialog(true)
      return
    }

    // Handle Qliro payment
    if (selectedPaymentMethod === 'qliro') {
      try {
        setLoading(true)
        const response = await fetch('/api/payments/qliro/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: bookingData.totalPrice,
            reference: `booking-${Date.now()}`,
            description: `Bokning: ${bookingData.lessonType.name}`,
            returnUrl: `${window.location.origin}/booking/confirmation`
          })
        })
        
        if (!response.ok) throw new Error('Kunde inte skapa Qliro-checkout')
        
        const { checkoutUrl } = await response.json()
        setQliroCheckoutUrl(checkoutUrl)
        setShowQliroDialog(true)
      } catch (error) {
        console.error('Qliro error:', error)
        toast({
          title: "Ett fel uppstod",
          description: "Kunde inte starta Qliro-checkout. Försök igen senare.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
      return
    }
    
    // Guest validation if not logged in
    if (!authUser && !isAdminOrTeacher) {
      if (!guestName || !guestEmail || !guestPhone) {
        toast({
          title: "Information saknas",
          description: "Vänligen fyll i alla kontaktuppgifter",
          variant: "destructive",
        })
        return
      }
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(guestEmail)) {
        toast({
          title: "Ogiltig e-postadress",
          description: "Vänligen ange en giltig e-postadress",
          variant: "destructive",
        })
        return
      }
    }
    
    if (isAdminOrTeacher && !selectedStudent) {
      toast({
        title: "Fel",
        description: "Välj en elev för bokningen",
        variant: "destructive",
      })
      return
    }

    // Validate supervisor information for handledar sessions when not admin/teacher
    if (isHandledarutbildning && !isAdminOrTeacher) {
      if (!supervisorName || !supervisorEmail || !supervisorPhone) {
        toast({
          title: "Fel",
          description: "Handledarinformation krävs för handledarutbildning",
          variant: "destructive",
        })
        return
      }
    }

    // If using credits for handledarutbildning, ensure they have enough credits
    if (selectedPaymentMethod === 'credits' && isHandledarutbildning && userCredits < 1) {
      toast({
        title: "Otillräckligt med krediter",
        description: "Du har inte tillräckligt med krediter för denna handledarutbildning",
        variant: "destructive",
      })
      return
    }

    const bookingData = {
      paymentMethod: selectedPaymentMethod,
      studentId: isAdminOrTeacher ? selectedStudent : undefined,
      alreadyPaid: isAdminOrTeacher ? alreadyPaid : false,
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

    onComplete(bookingData)
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
        description: 'Kort, Klarna, Faktura, Delbetalning',
        icon: <CreditCard className="w-5 h-5 text-purple-600" />,
        available: isHandledar
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

  // Handle payment confirmation
  const confirmBooking = (paymentMethod: string) => {
    if (!bookingData) {
      toast({
        title: "Fel",
        description: "Bokningsinformation saknas",
        variant: "destructive",
      })
      return
    }

    const bookingPayload: BookingCompletionData = {
      paymentMethod,
      totalPrice: bookingData.totalPrice,
      lessonType: {
        id: bookingData.lessonType?.id || '',
        name: bookingData.lessonType?.name || '',
        durationMinutes: bookingData.lessonType?.durationMinutes || 0,
        price: bookingData.lessonType?.price || 0,
        priceStudent: bookingData.lessonType?.priceStudent,
        salePrice: bookingData.lessonType?.salePrice,
        type: bookingData.lessonType?.type
      },
      guestName: isHandledarutbildning ? supervisorName : guestName,
      guestEmail: isHandledarutbildning ? supervisorEmail : guestEmail,
      guestPhone: isHandledarutbildning ? supervisorPhone : guestPhone,
      studentId: isAdminOrTeacher ? selectedStudent : undefined,
      alreadyPaid: isAdminOrTeacher ? (alreadyPaid === true) : false
    }
    onComplete(bookingPayload)
  }

  // Handle Swish payment confirmation
  const handleSwishConfirm = () => {
    setShowSwishDialog(false)
    confirmBooking('swish')
  }

  // Handle Qliro redirect
  const handleQliroRedirect = () => {
    if (qliroCheckoutUrl) {
      window.location.href = qliroCheckoutUrl
    }
  }

  // Show warning if user has too many unpaid bookings
  const showUnpaidWarning = isStudent && unpaidBookings >= 2 && 
                          (selectedPaymentMethod === 'pay_at_location' || !selectedPaymentMethod)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <CardContent>
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
                  <SelectContent>
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
                    <Input
                      id="guest-email"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="exempel@email.com"
                      className="mt-1"
                    />
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
              </div>
            )}

            {/* Supervisor Information for Handledar Sessions */}
            {isHandledarSession && !isAdminOrTeacher && (
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
                    <Input
                      id="supervisor-email"
                      type="email"
                      value={supervisorEmail}
                      onChange={(e) => setSupervisorEmail(e.target.value)}
                      placeholder="exempel@email.com"
                      className="mt-1"
                    />
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
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedPaymentMethod === 'credits' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setSelectedPaymentMethod('credits')}
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

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="font-medium">Välj betalningssätt</h3>
                
                {/* Credits Option */}
                {canUseCredits && (
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'credits' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
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
                          {isHandledarutbildning
                            ? `Använd ${userCredits} kredit${userCredits > 1 ? 'er' : ''} för denna handledarutbildning`
                            : `Du har ${userCredits} kredit${userCredits !== 1 ? 'er' : ''} kvar`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'qliro' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('qliro')}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      selectedPaymentMethod === 'qliro' ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                    }`}>
                      {selectedPaymentMethod === 'qliro' && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium">Qliro</p>
                      <p className="text-sm text-gray-500">Kort, Klarna, Faktura, Delbetalning</p>
                    </div>
                  </div>
                </div>

                {/* Pay at Location Option */}
                {canPayAtLocation && (
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'pay_at_location' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('pay_at_location')}
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
              disabled={loading || !selectedPaymentMethod || (isAdminOrTeacher && !selectedStudent)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 mb-4"
            >
              {loading ? "Bekräftar..." : "Bekräfta bokning"}
            </Button>
            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </div>
        </CardContent>
      </CardContent>

      {/* Swish Payment Dialog */}
      <Dialog open={showSwishDialog} onOpenChange={setShowSwishDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bekräfta Swish-betalning</DialogTitle>
            <DialogDescription>
              Öppna Swish-appen på din telefon för att slutföra betalningen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <SwishLogo />
            </div>
            <p className="text-lg font-semibold">{bookingData.totalPrice} SEK</p>
            <p className="text-sm text-gray-500 mb-4">Trafikskola X AB</p>
            
            <div className="w-full space-y-4">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleSwishConfirm}
              >
                Jag har betalat
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowSwishDialog(false)}
              >
                Avbryt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Qliro Payment Dialog */}
      <Dialog open={showQliroDialog} onOpenChange={setShowQliroDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Qliro Checkout</DialogTitle>
            <DialogDescription>
              Du kommer nu att skickas till Qliros säkra betalningssida.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="bg-purple-100 p-4 rounded-lg mb-4">
              <CreditCard className="w-16 h-16 text-purple-600 mx-auto" />
            </div>
            <p className="text-lg font-semibold">{bookingData.totalPrice} SEK</p>
            <p className="text-sm text-gray-500 mb-4">Välj betalningssätt hos Qliro</p>
            
            <div className="w-full space-y-2">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleQliroRedirect}
                disabled={!qliroCheckoutUrl}
              >
                {qliroCheckoutUrl ? 'Fortsätt till Qliro' : 'Laddar...'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowQliroDialog(false)}
              >
                Avbryt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
