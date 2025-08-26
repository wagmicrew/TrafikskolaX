"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ArrowLeft, Calendar, Clock, User, Car, UserPlus, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { OrbSpinner } from "@/components/ui/orb-loader"

import { LessonSelection } from "@/components/booking/lesson-selection"
import { WeekCalendar } from "@/components/booking/week-calendar"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dropdown, DropdownItem } from "flowbite-react"

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

type BookingStep = 'lesson-selection' | 'calendar' | 'session-selection' | 'confirmation' | 'complete'

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
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  
  const isAdmin = user?.role === 'admin'

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
    if (data.sessionType.type === 'teori') {
      setCurrentStep('session-selection')
    } else {
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

  const handleBookingComplete = () => {
    // Check if admin has selected a user
    if (isAdmin && !selectedUser) {
      alert('Du måste välja en användare att boka för innan du kan slutföra bokningen.')
      return
    }
    setCurrentStep('complete')
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
      case 'confirmation':
        return 'Bekräfta bokning'
      case 'complete':
        return 'Bokning bekräftad!'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'lesson-selection':
        return 'Börja med att välja vilken typ av körlektion du vill boka'
      case 'calendar':
        return 'Välj ett datum och en tid som passar dig'
      case 'session-selection':
        return 'Välj en tillgänglig teorisession från listan'
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-red-800 mb-4 tracking-tight">
              Boka Tid
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Enkel och snabb bokning av körlektioner online
            </p>
            

            
            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['lesson-selection', 'calendar', 'session-selection', 'confirmation', 'complete'].includes(currentStep)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm text-gray-600">Välj lektion</span>
              </div>

              <div className={`h-1 w-8 ${
                ['calendar', 'session-selection', 'confirmation', 'complete'].includes(currentStep)
                  ? 'bg-red-600'
                  : 'bg-gray-200'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['calendar', 'session-selection', 'confirmation', 'complete'].includes(currentStep)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {selectedLessonType?.type === 'teori' ? 'Välj session' : 'Välj tid'}
                </span>
              </div>

              <div className={`h-1 w-8 ${
                ['confirmation', 'complete'].includes(currentStep)
                  ? 'bg-red-600'
                  : 'bg-gray-200'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['confirmation', 'complete'].includes(currentStep)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm text-gray-600">Bekräfta</span>
              </div>

              <div className={`h-1 w-8 ${
                currentStep === 'complete' ? 'bg-green-600' : 'bg-gray-200'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'complete'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="ml-2 text-sm text-gray-600">Klar</span>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentStep !== 'lesson-selection' && currentStep !== 'complete' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="text-white hover:bg-red-800/50 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {getStepTitle()}
                    </CardTitle>
                    <p className="text-blue-100 mt-1">
                      {getStepDescription()}
                    </p>
                  </div>
                </div>
                
                {selectedLessonType && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
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
                  <div className="bg-white p-6 rounded-lg border border-red-200">
                    <h3 className="text-lg font-semibold text-red-800 mb-4">
                      Tillgängliga {selectedLessonType.name} sessioner
                    </h3>
                    <div className="space-y-4">
                      {selectedLessonType.sessions && selectedLessonType.sessions.length > 0 ? (
                        selectedLessonType.sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              session.availableSpots > 0
                                ? 'border-red-200 hover:border-red-400 hover:shadow-md'
                                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            }`}
                            onClick={() => session.availableSpots > 0 && handleSessionSelection(session)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{session.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{session.description}</p>
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
                                <div className="text-lg font-bold text-red-600">
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
              
              {currentStep === 'confirmation' && bookingData && (
                <div className="space-y-6">
                  {/* Admin User Selection */}
                  {isAdmin && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Boka för användare:
                      </label>
                      <div className="relative">
                        <Dropdown
                          label={
                            <div className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 shadow-lg">
                              <div className="flex items-center">
                                {selectedUser ? (
                                  <>
                                    <img
                                      className="w-6 h-6 me-2 rounded-full border-2 border-white"
                                      src={selectedUser.profilePicture || "/images/din-logo-small.png"}
                                      alt={selectedUser.name}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/images/din-logo-small.png";
                                      }}
                                    />
                                    <span className="truncate max-w-32">{selectedUser.name}</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-6 h-6 me-2" />
                                    <span>Välj användare</span>
                                  </>
                                )}
                              </div>
                              <ChevronDown className="w-2.5 h-2.5 ms-3 flex-shrink-0" />
                            </div>
                          }
                          color="red"
                          className="w-full"
                          disabled={loadingUsers}
                        >
                          <div className="h-48 py-2 overflow-y-auto text-gray-700 dark:text-gray-200">
                            {loadingUsers ? (
                              <DropdownItem disabled>
                                <div className="flex items-center px-4 py-2">
                                  <OrbSpinner size="sm" className="me-2" />
                                  Laddar användare...
                                </div>
                              </DropdownItem>
                            ) : users.length === 0 ? (
                              <DropdownItem disabled>
                                <div className="flex items-center px-4 py-2">
                                  Inga användare hittades
                                </div>
                              </DropdownItem>
                            ) : (
                              users.map((user) => (
                                <DropdownItem
                                  key={user.id}
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <div className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                    <img 
                                      className="w-6 h-6 me-2 rounded-full" 
                                      src={user.profilePicture || "/images/din-logo-small.png"} 
                                      alt={user.name}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/images/din-logo-small.png";
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.name}</span>
                                      <span className="text-xs text-gray-500">{user.email}</span>
                                      <span className="text-xs text-red-600 capitalize">{user.role}</span>
                                    </div>
                                  </div>
                                </DropdownItem>
                              ))
                            )}
                          </div>
                          <DropdownItem onClick={() => setShowNewUserForm(true)}>
                            <div className="flex items-center p-3 text-sm font-medium text-red-600 border-t border-gray-200 rounded-b-lg bg-red-50 dark:border-gray-600 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-400 hover:underline cursor-pointer">
                              <UserPlus className="w-4 h-4 me-2" />
                              Ny användare
                            </div>
                          </DropdownItem>
                        </Dropdown>
                        
                        {selectedUser && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                              <img 
                                className="w-8 h-8 me-3 rounded-full" 
                                src={selectedUser.profilePicture || "/images/din-logo-small.png"} 
                                alt={selectedUser.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/images/default-avatar.png";
                                }}
                              />
                              <div>
                                <div className="text-sm font-medium text-green-800">
                                  Bokar för: {selectedUser.name}
                                </div>
                                <div className="text-xs text-green-600">
                                  {selectedUser.email} • {selectedUser.role}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isAdmin && !selectedUser && (
                          <div className="mt-2 text-sm text-red-600">
                            Du måste välja en användare att boka för innan du kan fortsätta.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <BookingConfirmation
                    bookingData={bookingData}
                    user={selectedUser || user}
                    onComplete={handleBookingComplete}
                    onBack={handleBack}
                  />
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