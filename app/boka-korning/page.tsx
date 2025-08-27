"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ArrowLeft, Calendar, Clock, User, Car, UserPlus, ChevronDown, Phone } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import { OrbSpinner } from "@/components/ui/orb-loader"

import { LessonSelection } from "@/components/booking/lesson-selection"
import { WeekCalendar } from "@/components/booking/week-calendar"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dropdown, DropdownItem, Select, Label, TextInput, Card as FBCard } from "flowbite-react"

interface TeoriSession {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  currentParticipants: number
  price: number
  availableSpots: number
  formattedDateTime: string
}

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
  sessions?: TeoriSession[]
  hasAvailableSessions?: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  profilePicture?: string
  phone?: string
}

interface BookingData {
  id?: string
  tempBookingId?: string
  lessonType: SessionType
  selectedDate: Date
  selectedTime: string
  instructor: any | null
  vehicle: any | null
  totalPrice: number
  isStudent: boolean
  isHandledarutbildning: boolean
  transmissionType?: "manual" | "automatic" | null
  scheduledDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  bookingId?: string
  selectedSession?: TeoriSession
}

type BookingStep = 'lesson-selection' | 'calendar' | 'session-selection' | 'unavailable-session' | 'confirmation' | 'complete'

export default function BookingPage() {
  const { user, isLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState<BookingStep>('lesson-selection')
  const [selectedLessonType, setSelectedLessonType] = useState<SessionType | null>(null)
  const [transmissionType, setTransmissionType] = useState<"manual" | "automatic" | null>('manual')
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<TeoriSession | null>(null)
  
  // Admin user selection
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [effectiveUserDisplay, setEffectiveUserDisplay] = useState<User | null>(null)

  // Update temporary booking when student is selected
  const updateTemporaryBookingWithStudent = async (student: User) => {
    if (!bookingData?.bookingId) return

    try {
      const response = await fetch('/api/booking/update-student', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          studentId: student.id,
          sessionType: bookingData.lessonType?.type || 'lesson'
        }),
      })

      if (!response.ok) {
        console.error('Failed to update temporary booking with student info')
      } else {
        console.log('Successfully updated temporary booking with student info')
      }
    } catch (error) {
      console.error('Error updating temporary booking:', error)
    }
  }

  // Handle student selection - only handles the async API call
  const handleStudentSelect = async (student: User) => {
    if (bookingData?.bookingId) {
      await updateTemporaryBookingWithStudent(student)
    }
  }
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  
  const isAdmin = user?.role === 'admin'

  // Set effective user display for regular students
  useEffect(() => {
    if (user && user.role === 'student' && !selectedUser && !effectiveUserDisplay) {
      setEffectiveUserDisplay({
        id: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      })
    }
  }, [user, selectedUser, effectiveUserDisplay])

  // Fetch users when admin logs in
  useEffect(() => {
    if (isAdmin && !isLoading) {
      fetchUsers()
    }
  }, [isAdmin, isLoading])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const usersData = await response.json()
        // The API returns the users array directly
        const formattedUsers = usersData.map((user: any) => ({
          id: user.id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          phone: user.phone
        }))
        setUsers(formattedUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Calculate price based on user role
  const calculatePrice = (lessonType: SessionType): number => {
    if (user?.role === 'student' && lessonType.priceStudent) {
      return lessonType.priceStudent
    }
    if (lessonType.salePrice && lessonType.salePrice < lessonType.price) {
      return lessonType.salePrice
    }
    return lessonType.price
  }

  const handleLessonSelection = (data: { sessionType: SessionType }) => {
    setSelectedLessonType(data.sessionType)
    // lesson_types show calendar, teori_lesson_types show sessions if available
    if (data.sessionType.type === 'teori' || data.sessionType.type === 'handledar') {
      // Check if sessions are available for teori/handledar lessons
      if (data.sessionType.hasAvailableSessions) {
      setCurrentStep('session-selection')
    } else {
        // Show unavailable message with back button
        setCurrentStep('unavailable-session')
      }
    } else {
      // Regular driving lessons show calendar
      setCurrentStep('calendar')
    }
  }

  const handleCalendarSelection = (data: { selectedDate: Date; selectedTime: string; bookingId?: string }) => {
    if (selectedLessonType) {
      const endTime = calculateEndTime(data.selectedTime, selectedLessonType.durationMinutes)
      const bookingData: BookingData = {
        id: data.bookingId,
        lessonType: selectedLessonType,
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        instructor: null,
        vehicle: null,
        totalPrice: calculatePrice(selectedLessonType),
        isStudent: isAdmin ? (selectedUser?.role === 'student') : (user?.role === 'student'),
        isHandledarutbildning: selectedLessonType.type === 'handledar',
        transmissionType: transmissionType,
        scheduledDate: data.selectedDate.toISOString().split('T')[0],
        startTime: data.selectedTime,
        endTime: endTime,
        durationMinutes: selectedLessonType.durationMinutes,
        bookingId: data.bookingId,
        // Add selected user info for admin bookings
        ...(isAdmin && selectedUser && { selectedUserId: selectedUser.id, selectedUserName: selectedUser.name })
      }
      setBookingData(bookingData)
      setCurrentStep('confirmation')
    }
  }

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  const handleSessionSelection = (session: TeoriSession) => {
    if (selectedLessonType) {
      setSelectedSession(session)
      const bookingData: BookingData = {
        lessonType: selectedLessonType,
        selectedDate: new Date(session.date),
        selectedTime: session.startTime,
        instructor: null,
        vehicle: null,
        totalPrice: session.price,
        isStudent: isAdmin ? (selectedUser?.role === 'student') : (user?.role === 'student'),
        isHandledarutbildning: selectedLessonType.type === 'handledar',
        transmissionType: transmissionType,
        scheduledDate: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: selectedLessonType.durationMinutes,
        selectedSession: session,
        // Add selected user info for admin bookings
        ...(isAdmin && selectedUser && { selectedUserId: selectedUser.id, selectedUserName: selectedUser.name })
      }
      setBookingData(bookingData)
      setCurrentStep('confirmation')
    }
  }

  const handleBookingComplete = async () => {
    // Check if admin has selected a user
    if (isAdmin && !selectedUser) {
      alert('Du måste välja en användare att boka för innan du kan slutföra bokningen.')
      return
    }

    // Determine which user information to use for the booking
    const effectiveUser = selectedUser || (user && user.role === 'student' ? {
      id: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role
    } : null)

    // Update display state for UI
    setEffectiveUserDisplay(effectiveUser)

    // Ensure we have user information for the booking
    if (!effectiveUser) {
      toast.error('Ingen användarinformation tillgänglig för bokningen.')
      return
    }

    if (!bookingData) {
      toast.error('Ingen bokningsdata tillgänglig.')
      return
    }

    // Create booking first, then redirect to payment page
    const bookingDataToSend = {
      ...bookingData,
      selectedUserId: effectiveUser?.id,
      selectedUserName: effectiveUser?.name,
    }

    // Transform the booking data to match the API expectations
    const apiBookingData = {
      sessionId: bookingData.lessonType.id,
      sessionType: bookingData.lessonType.type,
      scheduledDate: bookingData.scheduledDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      durationMinutes: bookingData.durationMinutes,
      totalPrice: bookingData.totalPrice,
      paymentMethod: 'swish',
      paymentStatus: 'pending',
      // Add optional fields for admin bookings and transmission type
      ...(effectiveUser?.id && { studentId: effectiveUser.id }),
      ...(bookingData.transmissionType && { transmissionType: bookingData.transmissionType })
    }

    try {
      setLoading(true)

      // Check if we have an existing temporary booking to confirm
      if (bookingData.bookingId) {
        // Confirm existing temporary booking
        const confirmResponse = await fetch('/api/booking/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingData.bookingId,
            studentId: effectiveUser?.id,
            studentName: effectiveUser?.name,
            paymentMethod: 'swish'
          }),
        })

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to confirm booking')
        }

        const confirmResult = await confirmResponse.json()

        // Store booking data in sessionStorage for the payment page
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDataToSend))

        // Redirect to the payment page with the confirmed booking ID
        window.location.href = `/booking/payment/${bookingData.bookingId}`

      } else {
        // Fallback: Create new booking if no temporary booking exists
        const bookingResponse = await fetch('/api/booking/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiBookingData),
        })

        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create booking')
        }

        const bookingResult = await bookingResponse.json()

        // Store booking data in sessionStorage for the payment page
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDataToSend))

        // Redirect to the new payment page with the booking ID
        window.location.href = `/booking/payment/${bookingResult.booking.id}`
      }

    } catch (error) {
      console.error('Error confirming booking:', error)
      toast.error('Ett fel uppstod när bokningen skulle bekräftas. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'calendar':
        setCurrentStep('lesson-selection')
        break
      case 'session-selection':
        setCurrentStep('lesson-selection')
        break
      case 'confirmation':
        setCurrentStep(selectedLessonType?.type === 'teori' ? 'session-selection' : 'calendar')
        break
      case 'complete':
        setCurrentStep('lesson-selection')
        setBookingData(null)
        setSelectedLessonType(null)
        break
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'lesson-selection':
        return 'Välj typ av lektion'
      case 'calendar':
        return 'Välj datum och tid'
      case 'session-selection':
        return 'Välj teorisession'
      case 'unavailable-session':
        return 'Inga sessioner tillgängliga'
      case 'confirmation':
        return 'Bekräfta bokning'
      case 'complete':
        return 'Bokning bekräftad!'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'lesson-selection':
        return 'Börja med att välja vilken typ av lektion du vill boka'
      case 'calendar':
        return 'Välj ett datum och en tid som passar dig'
      case 'session-selection':
        return 'Välj en tillgänglig teorisession från listan'
      case 'unavailable-session':
        return 'Inga sessioner tillgängliga just nu'
      case 'confirmation':
        return 'Kontrollera dina uppgifter och slutför bokningen'
      case 'complete':
        return 'Din bokning har registrerats och du kommer att få en bekräftelse via e-post'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <OrbSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight font-['Inter','system-ui','-apple-system','sans-serif']">
              Boka Tid
            </h1>
            <p className="text-xl text-gray-900 mb-6 font-['Inter','system-ui','-apple-system','sans-serif'] font-medium">
              Enkel och snabb bokning av körlektioner online
            </p>
            

            
            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['lesson-selection', 'calendar', 'session-selection', 'unavailable-session', 'confirmation', 'complete'].includes(currentStep)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm text-gray-900 font-medium font-['Inter','system-ui','-apple-system','sans-serif']">Välj lektion</span>
              </div>

              <div className={`h-1 w-8 ${
                ['calendar', 'session-selection', 'unavailable-session', 'confirmation', 'complete'].includes(currentStep)
                  ? 'bg-blue-700'
                  : 'bg-gray-400'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['calendar', 'session-selection', 'unavailable-session', 'confirmation', 'complete'].includes(currentStep)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm text-gray-900 font-medium font-['Inter','system-ui','-apple-system','sans-serif']">
                  {(selectedLessonType?.type === 'teori' || selectedLessonType?.type === 'handledar')
                    ? (currentStep === 'unavailable-session' ? 'Ej tillgänglig' : 'Välj session')
                    : 'Välj tid'}
                </span>
              </div>

              <div className={`h-1 w-8 ${
                ['confirmation', 'complete'].includes(currentStep)
                  ? 'bg-blue-700'
                  : 'bg-gray-400'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['confirmation', 'complete'].includes(currentStep)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm text-gray-900 font-medium font-['Inter','system-ui','-apple-system','sans-serif']">Bekräfta</span>
              </div>

              <div className={`h-1 w-8 ${
                currentStep === 'complete' ? 'bg-green-700' : 'bg-gray-400'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'complete'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="ml-2 text-sm text-gray-900 font-medium font-['Inter','system-ui','-apple-system','sans-serif']">Klar</span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-white text-gray-900 border-b border-gray-200 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentStep !== 'lesson-selection' && currentStep !== 'complete' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 font-['Inter','system-ui','-apple-system','sans-serif']">
                      {getStepTitle()}
                    </CardTitle>
                    <p className="text-gray-600 mt-1 font-['Inter','system-ui','-apple-system','sans-serif']">
                      {getStepDescription()}
                    </p>
                  </div>
                </div>
                
                {selectedLessonType && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border border-blue-200 font-['Inter','system-ui','-apple-system','sans-serif']">
                    {selectedLessonType.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {currentStep === 'lesson-selection' && (
                <LessonSelection onComplete={handleLessonSelection} />
              )}
              
              {currentStep === 'calendar' && selectedLessonType && (
                <WeekCalendar
                  lessonType={selectedLessonType}
                  transmissionType={transmissionType}
                  totalPrice={calculatePrice(selectedLessonType)}
                  onComplete={handleCalendarSelection}
                  onBack={handleBack}
                />
              )}

              {currentStep === 'session-selection' && selectedLessonType && (
                <div className="space-y-6">
                  {/* Teori Session Selection */}
                  <div className="bg-white p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">
                      Tillgängliga {selectedLessonType.name} sessioner
                    </h3>
                    <div className="space-y-4">
                      {selectedLessonType.sessions && selectedLessonType.sessions.length > 0 ? (
                        selectedLessonType.sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              session.availableSpots > 0
                                ? 'border-blue-200 hover:border-blue-400 hover:shadow-md bg-blue-50'
                                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            }`}
                            onClick={() => session.availableSpots > 0 && handleSessionSelection(session)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{session.title}</h4>
                                {session.description && (
                                  <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {session.formattedDateTime}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {session.startTime} - {session.endTime}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {session.price} kr
                                </div>
                                <div className={`text-sm font-medium ${
                                  session.availableSpots > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {session.availableSpots > 0
                                    ? `${session.availableSpots} platser kvar`
                                    : 'Fullbokad'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Inga tillgängliga sessioner just nu.</p>
                          <p className="text-sm mt-2">Försök igen senare eller kontakta oss.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'unavailable-session' && selectedLessonType && (
                <div className="space-y-6">
                  {/* Unavailable Session Message */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Inga {selectedLessonType.name} sessioner tillgängliga
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Det finns för närvarande inga lediga platser för denna typ av session.
                        Du kan antingen vänta på att nya sessioner blir tillgängliga eller kontakta oss direkt.
                      </p>

                      <div className="space-y-3">
                        <Button
                          onClick={handleBack}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Tillbaka till lektionsval
                        </Button>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => window.location.href = '/kontakt'}
                            className="flex-1"
                          >
                            Kontakta oss
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => window.location.href = 'tel:0760389192'}
                            className="flex-1"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Ring oss
                          </Button>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Tips:</strong> Nya sessioner läggs ofta ut med kort varsel.
                          Håll utkik efter uppdateringar eller kontakta oss för att höra om kommande datum.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 'confirmation' && bookingData && (
                <div className="space-y-6">
                  {/* Booking Summary Card with Flowbite */}
                  <FBCard className="shadow-lg">
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        Bekräfta din bokning
                      </h3>

                      {/* Lesson Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Lektionstyp</Label>
                          <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border border-blue-200">
                                {selectedLessonType?.name}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Pris</Label>
                          <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-lg font-bold text-green-800">
                              {bookingData.totalPrice} kr
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Datum</Label>
                          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="font-medium">
                                {new Date(bookingData.scheduledDate).toLocaleDateString('sv-SE', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                              </div>
                            </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Tid</Label>
                          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="font-medium">
                                {bookingData.startTime} - {bookingData.endTime}
                                ({bookingData.durationMinutes} min)
                              </span>
                                </div>
                                </div>
                                    </div>
                                  </div>

                      {/* Admin User Selection - Inline Flowbite Select */}
                  {isAdmin && (
                    <div className="mb-6">
                          <div className="mb-2">
                            <Label htmlFor="student-select" className="text-sm font-medium text-gray-700">
                              Boka för elev:
                            </Label>
                              </div>

                          <div className="space-y-3">
                            <select
                              id="student-select"
                              value={selectedUser?.id || ''}
                              onChange={(e) => {
                                const userId = e.target.value;
                                if (userId === 'create-new') {
                                  setShowNewUserForm(true);
                                  return;
                                }
                                const user = users.find(u => u.id === userId);
                                if (user) {
                                  // Update UI state immediately
                                  setSelectedUser(user);
                                  setEffectiveUserDisplay(user);
                                  // Handle async API call separately
                                  handleStudentSelect(user).catch(console.error);
                                } else {
                                  setSelectedUser(null);
                                  setEffectiveUserDisplay(null);
                                }
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={loadingUsers}
                              required
                            >
                              <option value="">
                                {loadingUsers ? 'Laddar elever...' : 'Välj en elev'}
                              </option>
                              {users
                                .filter(user => user.role === 'student') // Only show students
                                .map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name} - {user.email}
                                  </option>
                                ))
                              }
                              <option value="create-new" className="font-medium text-blue-600">
                                ➕ Skapa ny elev
                              </option>
                            </select>

                            {loadingUsers && (
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                                </div>
                        
                                                  {/* New User Form */}
                          {showNewUserForm && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="text-sm font-medium text-blue-800 mb-3">Skapa ny elev</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="Förnamn"
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Efternamn"
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <input
                                  type="email"
                                  placeholder="E-post"
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <input
                                  type="tel"
                                  placeholder="Telefon"
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  onClick={() => setShowNewUserForm(false)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Avbryt
                                </Button>
                                <Button
                                  onClick={() => {
                                    // TODO: Implement create new user logic
                                    setShowNewUserForm(false);
                                    toast.success('Ny elev har skapats!');
                                  }}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Skapa elev
                                </Button>
                                    </div>
                                  </div>
                          )}

                          {selectedUser && !showNewUserForm && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                              <img 
                                  className="w-8 h-8 me-3 rounded-full border-2 border-green-300"
                                src={selectedUser.profilePicture || "/images/din-logo-small.png"} 
                                alt={selectedUser.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/din-logo-small.png";
                                }}
                              />
                              <div>
                                <div className="text-sm font-medium text-green-800">
                                  Bokar för: {effectiveUserDisplay?.name || 'Okänd användare'}
                                </div>
                                <div className="text-xs text-green-600">
                                    {effectiveUserDisplay?.email || 'Ingen e-post'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isAdmin && !selectedUser && (
                            <div className="mt-2 text-sm text-red-600 flex items-center">
                              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-red-600 text-xs">!</span>
                              </span>
                              Du måste välja en elev att boka för innan du kan fortsätta.
                          </div>
                        )}
                    </div>
                  )}
                  
                      {/* Booking Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <Button
                          onClick={handleBack}
                          variant="outline"
                          className="flex-1 sm:flex-none"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Tillbaka
                        </Button>

                        <Button
                          onClick={() => handleBookingComplete()}
                          disabled={isAdmin && !selectedUser}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Bekräfta bokning
                        </Button>
                      </div>
                    </div>
                  </FBCard>
                </div>
              )}
              
              {currentStep === 'complete' && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Bokning bekräftad!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Du kommer att få en bekräftelse via e-post inom kort.
                  </p>
                  
                  {bookingData && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
                      <h3 className="font-semibold text-gray-800 mb-3">Bokningsdetaljer</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Lektion:</span>
                          <span className="font-medium">{bookingData.lessonType.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Datum:</span>
                          <span className="font-medium">{bookingData.scheduledDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tid:</span>
                          <span className="font-medium">{bookingData.startTime} - {bookingData.endTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pris:</span>
                          <span className="font-medium">{bookingData.totalPrice} kr</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => {
                        setCurrentStep('lesson-selection')
                        setBookingData(null)
                        setSelectedLessonType(null)
                        setSelectedSession(null)
                        setSelectedUser(null)
                      }}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Boka en till lektion
                    </Button>
                    {user && (
                      <Button
                        onClick={() => window.location.href = '/dashboard'}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Gå till min sida
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Help Section */}
          {currentStep !== 'complete' && (
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Behöver du hjälp? Kontakta oss på{' '}
                <a href="tel:0760389192" className="text-blue-600 hover:underline font-medium">
                  0760-389192
                </a>
                {' '}eller{' '}
                <a href="mailto:info@dintrafikskolahlm.se" className="text-blue-600 hover:underline font-medium">
                  info@dintrafikskolahlm.se
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}