"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle, DollarSign, List, User, CreditCard } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

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
}

interface BookingConfirmationProps {
  bookingData: BookingData
  user: any
  onComplete: (data: { paymentMethod: string }) => void
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
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [userCredits, setUserCredits] = useState<number>(0)
  const [unpaidBookings, setUnpaidBookings] = useState<number>(0)
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [supervisorPhone, setSupervisorPhone] = useState('')
  const [participantCount, setParticipantCount] = useState(1)
  const [maxParticipants, setMaxParticipants] = useState(1)
  const { user: authUser } = useAuth()
  const { toast } = useToast()

  const isAdminOrTeacher = authUser?.role === 'admin' || authUser?.role === 'teacher'
  const isStudent = authUser?.role === 'student'

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
      const isHandledarutbildning = bookingData.lessonType.name === 'Handledarutbildning' || 
                                    bookingData.lessonType.name?.toLowerCase().includes('handledarutbildning')
      
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

  const handleConfirm = () => {
    if (!selectedPaymentMethod) return
    
    if (isAdminOrTeacher && !selectedStudent) {
      toast({
        title: "Fel",
        description: "Välj en elev för bokningen",
        variant: "destructive",
      })
      return
    }

    // Validate supervisor information for handledar sessions when not admin/teacher
    if (isHandledarSession && !isAdminOrTeacher) {
      if (!supervisorName || !supervisorEmail || !supervisorPhone) {
        toast({
          title: "Fel",
          description: "Handledare information krävs för handledarkurs",
          variant: "destructive",
        })
        return
      }
    }

    const bookingData = {
      paymentMethod: selectedPaymentMethod,
      studentId: isAdminOrTeacher ? selectedStudent : undefined,
      alreadyPaid: isAdminOrTeacher ? alreadyPaid : false,
      // Add supervisor information for handledar sessions
      ...(isHandledarSession && {
        guestName: supervisorName,
        guestEmail: supervisorEmail,
        guestPhone: supervisorPhone,
      }),
    }

    onComplete(bookingData)
  }

  const isHandledarutbildning = bookingData.lessonType.name === 'Handledarutbildning' || 
                                bookingData.lessonType.name?.toLowerCase().includes('handledarutbildning')
  const canUseCredits = isStudent && userCredits > 0 && (bookingData.lessonType.type !== 'handledar' || isHandledarutbildning)
  const canPayAtLocation = isStudent && unpaidBookings < 2 && bookingData.lessonType.type !== 'handledar'
  const isHandledarSession = bookingData.lessonType.type === 'handledar'

  // Create Swish logo SVG component
  const SwishLogo = () => (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FF5722"/>
      <path d="M25 35h50c5.5 0 10 4.5 10 10v10c0 5.5-4.5 10-10 10H25c-5.5 0-10-4.5-10-10V45c0-5.5 4.5-10 10-10z" fill="white"/>
      <text x="50" y="55" textAnchor="middle" fill="#FF5722" fontSize="16" fontWeight="bold">S</text>
    </svg>
  )

  return (
    <div className="space-y-6">
      <Card className="p-6">
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

            <div className="mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Betalningsmetod</h3>

              {/* Swish */}
              <div
                className={`p-4 rounded-lg cursor-pointer transition-all border ${
                  selectedPaymentMethod === "swish" ? "border-red-600 bg-red-50" : "hover:border-red-300"
                }`}
                onClick={() => setSelectedPaymentMethod("swish")}
              >
                <div className="flex items-center gap-2">
                  <SwishLogo />
                  <span>Swish</span>
                </div>
              </div>

              {/* Qliro - Available for all handledar sessions */}
              {isHandledarSession && (
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all border ${
                    selectedPaymentMethod === "qliro" ? "border-purple-600 bg-purple-50" : "hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedPaymentMethod("qliro")}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Qliro (Kort, Klarna, Faktura)</span>
                  </div>
                </div>
              )}

              {/* Credits - Only for students with credits */}
              {canUseCredits && (
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all border ${
                    selectedPaymentMethod === "credits" ? "border-red-600 bg-red-50" : "hover:border-red-300"
                  }`}
                  onClick={() => setSelectedPaymentMethod("credits")}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-600" />
                    <span>Kreditpoäng ({userCredits} tillgängliga)</span>
                  </div>
                </div>
              )}

              {/* Pay at location - Only for students with less than 2 unpaid bookings */}
              {canPayAtLocation && (
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all border ${
                    selectedPaymentMethod === "pay_at_location" ? "border-red-600 bg-red-50" : "hover:border-red-300"
                  }`}
                  onClick={() => setSelectedPaymentMethod("pay_at_location")}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-600" />
                    <span>Betala på plats</span>
                  </div>
                </div>
              )}

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
              onClick={handleConfirm}
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
      </Card>
    </div>
  )
}
