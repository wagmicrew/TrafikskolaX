"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ArrowLeft, Calendar, Clock, User, Car, UserPlus, ChevronDown, Phone, MoreVertical, CreditCard, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import { OrbSpinner } from "@/components/ui/orb-loader"
import { SessionSelection } from "@/components/booking/session-selection"

import { LessonSelection } from "@/components/booking/lesson-selection"
import { WeekCalendar } from "@/components/booking/week-calendar"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { GearSelection } from "@/components/booking/GearSelection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dropdown, DropdownItem, Select, Label, Card as FBCard } from "flowbite-react"
import DynamicHandledareForm from "@/components/booking/DynamicHandledareForm"
import StudentSelectionForm from "@/components/booking/StudentSelectionForm"



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
  // Add fields for guest booking
  requiresPersonalInfo?: boolean
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
  // Guest user information
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  guestPersonalNumber?: string
  // Handledare information
  handledare?: Array<{
    id?: string
    name: string
    email: string
    phone: string
    personalNumber: string
  }>
  // Student information
  selectedStudent?: {
    id: string
    name: string
    email: string
    phone?: string
    role: string
  }
}

type BookingStep = 'lesson-selection' | 'calendar' | 'gear-selection' | 'session-selection' | 'unavailable-session' | 'guest-info' | 'handledare-info' | 'confirmation' | 'complete'

/*
AI DESCRIPTION DOCUMENT - TRAFIKSKOLA BOKNING FLOW

BOOKING FLOW OVERVIEW:
======================

The booking system follows a structured 4-step flow designed to handle different user types and lesson types:

STEP 1: LESSON TYPE SELECTION
-----------------------------
- Displays lesson types from TWO TABLES:
  * lesson_types (regular driving lessons)
  * teori_lesson_types (teori and handledar sessions)
- Groups lessons by type:
  * Körlektioner (Regular driving lessons)
  * Teorilektioner (Theory lessons)
  * Handledarutbildning (Supervisor training)
- Each lesson shows pricing, duration, and availability

STEP 2: DATE/TIME OR SESSION SELECTION
-------------------------------------
- BRANCHING LOGIC:
  * Regular lessons (lesson_types) → Calendar view for date/time selection
  * Teori/Handledar sessions (teori_lesson_types) → Session list view
- Calendar shows available slots with real-time availability
- Sessions show participant counts and capacity

STEP 3: USER INFORMATION COLLECTION
----------------------------------
- CONDITIONAL BASED ON USER TYPE:
  * LOGGED-IN USERS:
    - Students: Skip to confirmation (use account info)
    - Admins: Can select existing student or create new
  * GUESTS (NOT LOGGED IN):
    - Collect: Name, Email, Phone, Swedish Personal Number
    - For Handledar sessions: Additional handledare information
  * HANDLEDAR SESSIONS:
    - Require at least 1 handledare
    - Each handledare needs: Name, Email, Phone, Personal Number

STEP 4: CONFIRMATION & PAYMENT
-----------------------------
- Shows complete booking summary
- Creates invoice with correct booker details
- Adds handledare to session if applicable
- Redirects to payment (Swish/Qliro) or shows payment options

FLOW CONTROL FEATURES:
====================

BACKWARD NAVIGATION:
- Users can navigate back at any step
- Temporary bookings are cleaned up when going back
- State is properly reset on navigation

FORWARD VALIDATION:
- Each step validates required information
- Clear error messages for missing data
- Progress indicators show current step

TEMPORARY BOOKING MANAGEMENT:
- Temporary bookings created during flow
- Automatically cleaned up on navigation/back
- Prevents double bookings and orphaned records

USER MENU (POST-BOOKING):
- Mark payment as completed (Swish)
- Cancel booking with confirmation
- Proper cleanup and state reset

TECHNICAL IMPLEMENTATION:
=======================

STATE MANAGEMENT:
- React hooks for local state
- Temporary booking IDs for cleanup
- Guest information collection
- Handledare management arrays

API INTEGRATION:
- RESTful endpoints for booking operations
- Proper error handling and user feedback
- Real-time availability checking

VALIDATION & SECURITY:
- Required field validation
- Swedish personal number format
- Email format validation
- SQL injection protection

FLOW DIAGRAM:
============

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Lesson Type    │───▶│  Date/Time or    │───▶│  User Info      │
│   Selection     │    │   Session List   │    │  Collection     │
│                 │    │                  │    │                 │
│ • Körlektioner  │    │ • Calendar view  │    │ • Guest details │
│ • Teorilektioner│    │ • Session list   │    │ • Handledare    │
│ • Handledar     │    │                  │    │   (if needed)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   Confirmation   │
                    │   & Payment      │
                    │                  │
                    │ • Invoice        │
                    │ • Payment        │
                    │ • User menu      │
                    └──────────────────┘
*/

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
  
  // Handledare selection for teori sessions
  const [selectedHandledare, setSelectedHandledare] = useState<User[]>([])
  const [showHandledareForm, setShowHandledareForm] = useState(false)

  // Session pagination
  const [currentPage, setCurrentPage] = useState(1)
  const sessionsPerPage = 10
  
  // Guest user information
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    personalNumber: ''
  })

  // Dynamic handledare form state
  const [handledareList, setHandledareList] = useState<Array<{
    id?: string
    name: string
    email: string
    phone: string
    personalNumber: string
  }>>([])
  const [showDynamicHandledareForm, setShowDynamicHandledareForm] = useState(false)

  // Student selection state
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string
    name: string
    email: string
    phone?: string
    role: string
  } | null>(null)
  const [showStudentForm, setShowStudentForm] = useState(false)

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
    setCurrentPage(1) // Reset pagination when selecting a new lesson type

    // For teori lessons, check if sessions are available
    if (data.sessionType.type === 'teori') {
      if (data.sessionType.hasAvailableSessions && data.sessionType.sessions && data.sessionType.sessions.length > 0) {
        setCurrentStep('session-selection')
      } else {
        // Show unavailable message with contact form option
        setCurrentStep('unavailable-session')
      }
    } else if (data.sessionType.type === 'handledar') {
      // Handledar sessions go directly to session selection (they handle their own availability)
      setCurrentStep('session-selection')
    } else {
      // Regular driving lessons go to calendar
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
        tempBookingId: data.bookingId, // Track temporary booking for cleanup
        // Add selected user info for admin bookings
        ...(isAdmin && selectedUser && { selectedUserId: selectedUser.id, selectedUserName: selectedUser.name })
      }
      setBookingData(bookingData)

      // Determine next step based on lesson type and user type
      if (selectedLessonType?.type === 'lesson') {
        // Driving lessons need gear selection
        setCurrentStep('gear-selection')
      } else if (!user) {
        // Guest user - collect personal information
        setCurrentStep('guest-info')
      } else if (user.role === 'student') {
        // Student - go directly to confirmation
        setCurrentStep('confirmation')
      } else if (isAdmin && selectedUser?.role === 'student') {
        // Admin booking for student - go directly to confirmation
        setCurrentStep('confirmation')
      } else {
        // Admin/teacher booking for themselves or others - go to confirmation
        setCurrentStep('confirmation')
      }
    }
  }

  const handleGearSelection = (data: { transmissionType: "manual" | "automatic" }) => {
    if (bookingData) {
      const updatedBookingData = {
        ...bookingData,
        transmissionType: data.transmissionType
      }
      setBookingData(updatedBookingData)
      setTransmissionType(data.transmissionType)

      // After gear selection, determine next step based on user type
      if (!user) {
        // Guest user - collect personal information
        setCurrentStep('guest-info')
      } else if (user.role === 'student') {
        // Student - go directly to confirmation
        setCurrentStep('confirmation')
      } else if (isAdmin && selectedUser?.role === 'student') {
        // Admin booking for student - go directly to confirmation
        setCurrentStep('confirmation')
      } else {
        // Admin/teacher booking for themselves or others - go to confirmation
        setCurrentStep('confirmation')
      }
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
        tempBookingId: session.id, // Track session for temporary booking cleanup
        // Add selected user info for admin bookings
        ...(isAdmin && selectedUser && { selectedUserId: selectedUser.id, selectedUserName: selectedUser.name })
      }
      setBookingData(bookingData)

      // Determine next step based on user type and session requirements
      if (!user) {
        // Guest user - collect personal information
        setCurrentStep('guest-info')
      } else if (user.role === 'student') {
        // Student - go directly to confirmation
        setCurrentStep('confirmation')
      } else if (isAdmin) {
        // Admin - always go to confirmation for both teori and handledare
        // They will select student and handledare in the confirmation step
        setCurrentStep('confirmation')
      } else {
        // Other user types - go to confirmation
      setCurrentStep('confirmation')
      }
    }
  }

  const handleBookingComplete = async () => {
    // Check if admin has selected a user (required for handledare sessions)
    if (isAdmin && selectedLessonType?.type === 'handledar' && !selectedUser) {
      toast.error('Du måste välja en elev för handledarutbildning.')
      return
    }

    // Check if admin has selected a user for teori sessions (optional but recommended)
    if (isAdmin && selectedLessonType?.type === 'teori' && !selectedUser && !user) {
      toast.error('Du måste välja en elev eller vara inloggad som elev.')
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

    // For guest users, ensure we have guest information
    if (!user && (!bookingData?.guestName || !bookingData?.guestEmail || !bookingData?.guestPhone || !bookingData?.guestPersonalNumber)) {
      toast.error('Vänligen fyll i alla obligatoriska fält för gästbokning.')
      return
    }

    // For handledare sessions, ensure we have handledare information
    if (selectedLessonType?.type === 'handledar' && (!bookingData?.handledare || bookingData.handledare.length === 0)) {
      toast.error('Vänligen ange minst en handledare för denna handledarutbildning.')
      return
    }

    // Validate handledare information completeness
    if (handledareList && handledareList.length > 0) {
      const incompleteHandledare = handledareList.find(h =>
        !h.name.trim() || !h.email.trim() || !h.phone.trim() || !h.personalNumber.trim()
      );
      if (incompleteHandledare) {
        toast.error('Vänligen fyll i alla obligatoriska fält för alla handledare.')
        return
      }
    }

    // Validate student selection for non-student users
    if (user && user.role !== 'student' && !selectedStudent) {
      toast.error('Vänligen välj en elev för denna bokning.')
      return
    }

    // Validate minimum handledare for handledar sessions
    if (selectedLessonType?.type === 'handledar' && handledareList.length === 0) {
      toast.error('Minst 1 handledare krävs för handledarutbildning.')
      return
    }

    if (!bookingData) {
      toast.error('Ingen bokningsdata tillgänglig.')
      return
    }

    // Create booking first, then redirect to payment page
    const bookingDataToSend = {
      ...bookingData,
      selectedUserId: selectedStudent?.id || effectiveUser?.id,
      selectedUserName: selectedStudent?.name || effectiveUser?.name,
      selectedHandledare: selectedHandledare,
      handledare: handledareList,
      selectedStudent: selectedStudent,
    }

    // Transform the booking data to match the API expectations
    const apiBookingData = {
      sessionId: bookingData.lessonType.id,
      sessionType: bookingData.lessonType.type,
      scheduledDate: bookingData.scheduledDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      durationMinutes: bookingData.durationMinutes || selectedLessonType?.durationMinutes || 60,
      totalPrice: bookingData.totalPrice,
      paymentMethod: 'swish',
      paymentStatus: 'pending',
      // Add optional fields for admin bookings and transmission type
      ...(selectedStudent?.id && { studentId: selectedStudent.id }),
      ...(bookingData.transmissionType && { transmissionType: bookingData.transmissionType }),
      // Add guest information if applicable
      ...(bookingData.guestName && { guestName: bookingData.guestName }),
      ...(bookingData.guestEmail && { guestEmail: bookingData.guestEmail }),
      ...(bookingData.guestPhone && { guestPhone: bookingData.guestPhone }),
      ...(bookingData.guestPersonalNumber && { guestPersonalNumber: bookingData.guestPersonalNumber }),
      // Add handledare information if applicable
      ...(handledareList && handledareList.length > 0 && { handledare: handledareList })
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
            studentId: selectedStudent?.id || effectiveUser?.id,
            studentName: selectedStudent?.name || effectiveUser?.name,
            paymentMethod: 'swish',
            handledare: handledareList,
            // Add guest and handledare information
            ...(bookingData.guestName && { guestName: bookingData.guestName }),
            ...(bookingData.guestEmail && { guestEmail: bookingData.guestEmail }),
            ...(bookingData.guestPhone && { guestPhone: bookingData.guestPhone }),
            ...(bookingData.guestPersonalNumber && { guestPersonalNumber: bookingData.guestPersonalNumber }),
            ...(bookingData.handledare && { handledare: bookingData.handledare })
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
        const apiDataWithHandledare = {
          ...apiBookingData,
          handledare: handledareList
        };
        
        const bookingResponse = await fetch('/api/booking/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiDataWithHandledare),
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

  const handleBack = async () => {
    switch (currentStep) {
      case 'calendar':
        setCurrentStep('lesson-selection')
        break
      case 'gear-selection':
        setCurrentStep('calendar')
        break
      case 'session-selection':
        // Both teori and handledar sessions now go back to lesson-selection
        setCurrentStep('lesson-selection')
        setCurrentPage(1) // Reset pagination when going back
        break
      case 'guest-info':
        // If going back from guest-info, delete temporary booking and start over
        if (bookingData?.tempBookingId) {
          try {
            await fetch(`/api/booking/cleanup?bookingId=${bookingData.tempBookingId}&sessionType=${selectedLessonType?.type || 'lesson'}`, {
              method: 'DELETE'
            })
          } catch (error) {
            console.error('Failed to cleanup temporary booking:', error)
          }
        }
        setCurrentStep(selectedLessonType?.type === 'teori' || selectedLessonType?.type === 'handledar' ? 'session-selection' : 'calendar')
        setBookingData(null)
        break
      case 'handledare-info':
        setCurrentStep('guest-info')
        break
      case 'confirmation':
        // If going back from confirmation without confirming, cleanup temporary booking
        if (bookingData?.tempBookingId) {
          try {
            await fetch(`/api/booking/cleanup?bookingId=${bookingData.tempBookingId}&sessionType=${selectedLessonType?.type || 'lesson'}`, {
              method: 'DELETE'
            })
            setBookingData(null)
          } catch (error) {
            console.error('Failed to cleanup temporary booking:', error)
          }
        }

        // Determine the correct previous step based on lesson type
        if (selectedLessonType?.type === 'teori' || selectedLessonType?.type === 'handledar') {
          if (!user) {
            setCurrentStep('guest-info')
          } else {
            setCurrentStep('session-selection')
          }
        } else {
          if (!user) {
            setCurrentStep('guest-info')
          } else {
            setCurrentStep('calendar')
          }
        }
        break
      case 'complete':
        setCurrentStep('lesson-selection')
        setBookingData(null)
        setSelectedLessonType(null)
        setGuestInfo({ name: '', email: '', phone: '', personalNumber: '' })
        setHandledareInfo([])
        break
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'lesson-selection':
        return 'Välj typ av lektion'
      case 'calendar':
        return 'Välj datum och tid'
      case 'gear-selection':
        return 'Välj växellåda'
      case 'session-selection':
        return 'Välj session'
      case 'unavailable-session':
        return 'Inga sessioner tillgängliga'
      case 'guest-info':
        return 'Ange dina uppgifter'
      case 'handledare-info':
        return 'Ange handledare uppgifter'
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
      case 'gear-selection':
        return 'Välj vilken typ av växellåda du vill öva med'
      case 'session-selection':
        return 'Välj en tillgänglig session från listan'
      case 'unavailable-session':
        return 'Inga sessioner tillgängliga just nu'
      case 'guest-info':
        return 'Fyll i dina kontaktuppgifter för att slutföra bokningen'
      case 'handledare-info':
        return 'Ange uppgifter för handledare som ska delta i sessionen'
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
                  ['lesson-selection', 'calendar', 'session-selection', 'unavailable-session', 'guest-info', 'handledare-info', 'confirmation', 'complete'].includes(currentStep)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm text-gray-900 font-medium font-['Inter','system-ui','-apple-system','sans-serif']">Välj lektion</span>
              </div>

              <div className={`h-1 w-8 ${
                ['calendar', 'session-selection', 'unavailable-session', 'guest-info', 'handledare-info', 'confirmation', 'complete'].includes(currentStep)
                  ? 'bg-blue-700'
                  : 'bg-gray-400'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['calendar', 'session-selection', 'unavailable-session', 'guest-info', 'handledare-info', 'confirmation', 'complete'].includes(currentStep)
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
                ['guest-info', 'handledare-info', 'confirmation', 'complete'].includes(currentStep)
                  ? 'bg-blue-700'
                  : 'bg-gray-400'
              }`} />

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  ['guest-info', 'handledare-info', 'confirmation', 'complete'].includes(currentStep)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm text-gray-900 font-medium font-['Inter','system-ui','-apple-system','sans-serif']">
                  {currentStep === 'guest-info' ? 'Uppgifter' : 
                   currentStep === 'handledare-info' ? 'Handledare' : 'Bekräfta'}
                </span>
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

              {currentStep === 'gear-selection' && selectedLessonType && bookingData && (
                <GearSelection
                  selectedDate={bookingData.selectedDate}
                  selectedTime={bookingData.selectedTime}
                  lessonTypeName={selectedLessonType.name}
                  onComplete={handleGearSelection}
                  onBack={handleBack}
                />
              )}

              {currentStep === 'session-selection' && selectedLessonType && (
                <SessionSelection
                  sessionType={selectedLessonType}
                  onComplete={(data) => {
                    setSelectedSession(data.session)
                    setCurrentStep('confirmation')
                  }}
                  onBack={handleBack}
                />
              )}

              {currentStep === 'confirmation' && selectedLessonType && selectedSession && (
                <div className="space-y-6">
                  {/* Booking Summary Card */}
                  <FBCard className="shadow-lg">
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        Bekräfta din bokning
                      </h3>

                      {/* Session Details */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Sessionsdetaljer</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Typ:</span>
                            <span className="font-medium">{selectedLessonType.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Datum & Tid:</span>
                            <span className="font-medium">{selectedSession.formattedDateTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pris per deltagare:</span>
                            <span className="font-medium text-red-600">{selectedSession.price} kr</span>
                          </div>
                          {selectedLessonType.type === 'handledar' && selectedLessonType.pricePerSupervisor && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Extra handledare:</span>
                              <span className="font-medium text-blue-600">+{selectedLessonType.pricePerSupervisor} kr/st</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tillgängliga platser:</span>
                            <span className="font-medium text-green-600">{selectedSession.availableSpots} st</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Selection */}
                      <StudentSelectionForm
                        selectedStudent={selectedStudent}
                        onStudentSelect={(student) => {
                          setSelectedStudent(student)
                        }}
                        userIsStudent={user?.role === 'student'}
                        user={user ? {
                          id: user.id,
                          name: user.firstName + ' ' + user.lastName,
                          email: user.email,
                          phone: user.phone,
                          role: user.role
                        } : null}
                        sessionType={selectedLessonType.type}
                      />

                      {/* Dynamic Handledare Form */}
                      {selectedLessonType.type === 'handledar' && (
                        <div className="mt-6">
                          <DynamicHandledareForm
                            handledare={handledareList}
                            onChange={setHandledareList}
                            maxSpots={selectedSession.maxParticipants}
                            currentOccupancy={selectedSession.currentParticipants}
                            sessionType={selectedLessonType.type}
                          />
                        </div>
                      )}

                      {/* Booking Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                        <Button
                          onClick={handleBack}
                          variant="outline"
                          className="flex-1 sm:flex-none"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Tillbaka
                        </Button>

                        <Button
                          onClick={() => handleSessionSelection(selectedSession)}
                          disabled={
                            loading ||
                            (selectedLessonType.type === 'handledar' && (
                              (!selectedStudent && !user) ||
                              handledareList.length === 0 ||
                              handledareList.some(h =>
                                !h.name.trim() || !h.email.trim() || !h.phone.trim() || !h.personalNumber.trim()
                              )
                            )) ||
                            (user && user.role !== 'student' && !selectedStudent)
                          }
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loading ? (
                            <OrbSpinner size="sm" className="mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          {loading ? 'Behandlar...' : 'Bekräfta bokning'}
                        </Button>
                      </div>
                    </div>
                  </FBCard>
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

                        <Button
                          variant="outline"
                          onClick={() => {
                            // Open contact form modal
                            const contactForm = document.createElement('div')
                            contactForm.innerHTML = `
                              <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                  <h3 class="text-lg font-semibold mb-4">Kontakta oss</h3>
                                  <p class="text-gray-600 mb-4">Berätta för oss vilken typ av session du är intresserad av så kan vi hjälpa dig att boka en tid.</p>
                                  <form id="contact-form" class="space-y-4">
                                    <div>
                                      <label class="block text-sm font-medium text-gray-700 mb-1">Namn *</label>
                                      <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    <div>
                                      <label class="block text-sm font-medium text-gray-700 mb-1">E-post *</label>
                                      <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    <div>
                                      <label class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                      <input type="tel" name="phone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                                    <div>
                                      <label class="block text-sm font-medium text-gray-700 mb-1">Meddelande</label>
                                      <textarea name="message" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
                                    </div>
                                    <div class="flex gap-3">
                                      <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Avbryt</button>
                                      <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Skicka</button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            `
                            document.body.appendChild(contactForm)

                            // Handle form submission
                            const form = contactForm.querySelector('#contact-form') as HTMLFormElement
                            form?.addEventListener('submit', async (e) => {
                              e.preventDefault()
                              const formData = new FormData(form)
                              const data = Object.fromEntries(formData)

                              try {
                                const response = await fetch('/api/contact', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    ...data,
                                    subject: `Förfrågan om ${selectedLessonType.name}`,
                                    message: `${data.message}\n\nIntresserad av: ${selectedLessonType.name}\nDatum: ${new Date().toLocaleDateString('sv-SE')}`
                                  }),
                                })

                                if (response.ok) {
                                  toast.success('Din förfrågan har skickats!')
                                  contactForm.remove()
                                } else {
                                  toast.error('Kunde inte skicka förfrågan. Försök igen senare.')
                                }
                              } catch (error) {
                                console.error('Error sending contact form:', error)
                                toast.error('Ett fel uppstod. Försök igen senare.')
                              }
                            })
                          }}
                          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3"
                        >
                          Kontakta oss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {currentStep === 'guest-info' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">
                      Ange dina kontaktuppgifter
                    </h3>
                    <p className="text-sm text-blue-600 mb-6">
                      För att slutföra bokningen behöver vi dina kontaktuppgifter
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guest-name" className="text-sm font-medium text-gray-700">
                          Namn *
                        </Label>
                        <TextInput
                          id="guest-name"
                          type="text"
                          value={guestInfo.name}
                          onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ditt fullständiga namn"
                          required
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guest-email" className="text-sm font-medium text-gray-700">
                          E-post *
                        </Label>
                        <TextInput
                          id="guest-email"
                          type="email"
                          value={guestInfo.email}
                          onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="din.email@example.com"
                          required
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guest-phone" className="text-sm font-medium text-gray-700">
                          Telefon *
                        </Label>
                        <TextInput
                          id="guest-phone"
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="0760-123456"
                          required
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guest-personal-number" className="text-sm font-medium text-gray-700">
                          Personnummer *
                        </Label>
                        <TextInput
                          id="guest-personal-number"
                          type="text"
                          value={guestInfo.personalNumber}
                          onChange={(e) => setGuestInfo(prev => ({ ...prev, personalNumber: e.target.value }))}
                          placeholder="ÅÅMMDD-XXXX"
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleBack}
                        variant="outline"
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Tillbaka
                      </Button>
                      
                      <Button
                        onClick={() => {
                          if (guestInfo.name && guestInfo.email && guestInfo.phone && guestInfo.personalNumber) {
                            setBookingData(prev => prev ? {
                              ...prev,
                              guestName: guestInfo.name,
                              guestEmail: guestInfo.email,
                              guestPhone: guestInfo.phone,
                              guestPersonalNumber: guestInfo.personalNumber
                            } : null)
                            
                            // Check if this is a handledare session that requires additional info
                            if (selectedLessonType?.type === 'handledar') {
                              // Initialize with at least one handledare for handledare sessions
                              setHandledareInfo([{
                                name: '',
                                email: '',
                                phone: '',
                                personalNumber: ''
                              }])
                              setCurrentStep('handledare-info')
                            } else {
                              setCurrentStep('confirmation')
                            }
                          } else {
                            toast.error('Vänligen fyll i alla obligatoriska fält')
                          }
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Fortsätt
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'handledare-info' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">
                      Ange uppgifter för handledare
                    </h3>
                    <p className="text-sm text-blue-600 mb-6">
                      För handledarutbildning behöver vi uppgifter om varje handledare som ska delta.
                      Varje handledare upptar en plats på kursen.
                    </p>

                    {/* Spot availability info */}
                    {selectedSession && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-blue-800">
                          <User className="w-4 h-4" />
                          <span className="font-medium">Tillgängliga platser:</span>
                          <span className="font-bold">{selectedSession.availableSpots} av {selectedSession.maxParticipants}</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          1 student + {handledareInfo.length} handledare = {1 + handledareInfo.length} platser upptagna
                        </p>
                        {selectedSession.availableSpots < (1 + handledareInfo.length) && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                            <strong>Obs:</strong> Du har valt för många handledare för denna kurs.
                            Antingen välj en annan kurs eller minska antalet handledare till {selectedSession.availableSpots - 1}.
                          </div>
                        )}
                      </div>
                    )}

                    {handledareInfo.map((handledare, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Handledare {index + 1}</h4>
                          {handledareInfo.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setHandledareInfo(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              Ta bort
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`handledare-name-${index}`} className="text-sm font-medium text-gray-700">
                              Fullständigt namn *
                            </Label>
                            <TextInput
                              id={`handledare-name-${index}`}
                              type="text"
                              value={handledare.name}
                              onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                i === index ? { ...h, name: e.target.value } : h
                              ))}
                              placeholder="Förnamn Efternamn"
                              required
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`handledare-email-${index}`} className="text-sm font-medium text-gray-700">
                              E-postadress *
                            </Label>
                            <TextInput
                              id={`handledare-email-${index}`}
                              type="email"
                              value={handledare.email}
                              onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                i === index ? { ...h, email: e.target.value } : h
                              ))}
                              placeholder="namn@exempel.se"
                              required
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`handledare-phone-${index}`} className="text-sm font-medium text-gray-700">
                              Telefonnummer *
                            </Label>
                            <TextInput
                              id={`handledare-phone-${index}`}
                              type="tel"
                              value={handledare.phone}
                              onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                i === index ? { ...h, phone: e.target.value } : h
                              ))}
                              placeholder="070-123 45 67"
                              required
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`handledare-personal-${index}`} className="text-sm font-medium text-gray-700">
                              Personnummer *
                            </Label>
                            <TextInput
                              id={`handledare-personal-${index}`}
                              type="text"
                              value={handledare.personalNumber}
                              onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                i === index ? { ...h, personalNumber: e.target.value } : h
                              ))}
                              placeholder="ÅÅÅÅMMDD-NNNN"
                              required
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add handledare button - only show if spots available */}
                    {selectedSession && selectedSession.availableSpots > (1 + handledareInfo.length) && (
                      <Button
                        onClick={() => setHandledareInfo(prev => [...prev, {
                          name: '',
                          email: '',
                          phone: '',
                          personalNumber: ''
                        }])}
                        variant="outline"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                      >
                        + Lägg till ytterligare handledare
                      </Button>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => setCurrentStep('guest-info')}
                        variant="outline"
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Tillbaka
                      </Button>

                      <Button
                        onClick={() => {
                          // Check spot availability
                          const totalParticipants = 1 + handledareInfo.length; // 1 student + handledare
                          if (selectedSession && totalParticipants > selectedSession.availableSpots) {
                            toast.error(`För många deltagare! Endast ${selectedSession.availableSpots} platser tillgängliga.`);
                            return;
                          }

                          if (handledareInfo.length > 0 && handledareInfo.every(h =>
                            h.name && h.email && h.phone && h.personalNumber
                          )) {
                            setBookingData(prev => prev ? {
                              ...prev,
                              handledare: handledareInfo
                            } : null)
                            setCurrentStep('confirmation')
                          } else {
                            toast.error('Vänligen fyll i alla obligatoriska fält för alla handledare')
                          }
                        }}
                        disabled={!selectedSession || (1 + handledareInfo.length) > selectedSession.availableSpots}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Fortsätt till bekräftelse
                      </Button>
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
                            onClick={() => {
                              // Open contact form modal
                              const contactForm = document.createElement('div')
                              contactForm.innerHTML = `
                                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                  <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                    <h3 class="text-lg font-semibold mb-4">Kontakta oss</h3>
                                    <p class="text-gray-600 mb-4">Berätta för oss vilken typ av session du är intresserad av så kan vi hjälpa dig att boka en tid.</p>
                                    <form id="contact-form" class="space-y-4">
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Namn *</label>
                                        <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">E-post *</label>
                                        <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                        <input type="tel" name="phone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Meddelande *</label>
                                        <textarea name="message" rows="3" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Jag är intresserad av ${selectedLessonType?.name} sessioner. När kommer nya tider att bli tillgängliga?"></textarea>
                                      </div>
                                      <div class="flex gap-3 pt-2">
                                        <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                          Avbryt
                                        </button>
                                        <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                          Skicka
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                </div>
                              `
                              document.body.appendChild(contactForm)
                              
                              // Handle form submission
                              const form = contactForm.querySelector('#contact-form')
                              form?.addEventListener('submit', async (e) => {
                                e.preventDefault()
                                const formData = new FormData(e.target as HTMLFormElement)
                                
                                try {
                                  const response = await fetch('/api/contact', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      name: formData.get('name'),
                                      email: formData.get('email'),
                                      phone: formData.get('phone'),
                                      message: formData.get('message'),
                                      preferredContact: 'email'
                                    })
                                  })
                                  
                                  if (response.ok) {
                                    toast.success('Ditt meddelande har skickats! Vi återkommer snart.')
                                    contactForm.remove()
                                  } else {
                                    toast.error('Kunde inte skicka meddelandet. Försök igen senare.')
                                  }
                                } catch (error) {
                                  toast.error('Ett fel uppstod. Försök igen senare.')
                                }
                              })
                            }}
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

                                            {/* Admin User Selection - Only for Teori sessions */}
                      {isAdmin && selectedLessonType?.type === 'teori' && (
                    <div className="mb-6">
                          <div className="mb-2">
                            <Label htmlFor="student-select" className="text-sm font-medium text-gray-700">
                              Välj elev (valfritt):
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
                            >
                              <option value="">
                                {loadingUsers ? 'Laddar elever...' : 'Ingen elev vald (gästbokning)'}
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
                      )}

                      {/* Handledare Selection - Only for Handledar sessions */}
                      {isAdmin && selectedLessonType?.type === 'handledar' && (
                        <div className="mb-6">
                          <div className="mb-4">
                            <Label className="text-sm font-medium text-gray-700">
                              Välj elev och ange handledare:
                            </Label>
                          </div>

                          {/* Student Selection for Handledare */}
                          <div className="mb-4">
                            <Label htmlFor="handledare-student-select" className="text-sm font-medium text-gray-700">
                              Välj elev:
                            </Label>
                            <select
                              id="handledare-student-select"
                              value={selectedUser?.id || ''}
                              onChange={(e) => {
                                const userId = e.target.value;
                                if (userId === 'create-new') {
                                  setShowNewUserForm(true);
                                  return;
                                }
                                const user = users.find(u => u.id === userId);
                                if (user) {
                                  setSelectedUser(user);
                                  setEffectiveUserDisplay(user);
                                  handleStudentSelect(user).catch(console.error);
                                } else {
                                  setSelectedUser(null);
                                  setEffectiveUserDisplay(null);
                                }
                              }}
                              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              disabled={loadingUsers}
                              required
                            >
                              <option value="">
                                {loadingUsers ? 'Laddar elever...' : 'Välj en elev'}
                              </option>
                              {users
                                .filter(user => user.role === 'student')
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
                          </div>

                          {/* Handledare Manual Entry */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Handledare (1 eller fler):</h4>

                            {handledareInfo.map((handledare, index) => (
                              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium text-gray-900">Handledare {index + 1}</h5>
                                  {handledareInfo.length > 1 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setHandledareInfo(prev => prev.filter((_, i) => i !== index))}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      Ta bort
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Fullständigt namn *
                                    </Label>
                                    <TextInput
                                      type="text"
                                      value={handledare.name}
                                      onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                        i === index ? { ...h, name: e.target.value } : h
                                      ))}
                                      placeholder="Förnamn Efternamn"
                                      required
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      E-postadress *
                                    </Label>
                                    <TextInput
                                      type="email"
                                      value={handledare.email}
                                      onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                        i === index ? { ...h, email: e.target.value } : h
                                      ))}
                                      placeholder="namn@exempel.se"
                                      required
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Telefonnummer *
                                    </Label>
                                    <TextInput
                                      type="tel"
                                      value={handledare.phone}
                                      onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                        i === index ? { ...h, phone: e.target.value } : h
                                      ))}
                                      placeholder="070-123 45 67"
                                      required
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Personnummer *
                                    </Label>
                                    <TextInput
                                      type="text"
                                      value={handledare.personalNumber}
                                      onChange={(e) => setHandledareInfo(prev => prev.map((h, i) =>
                                        i === index ? { ...h, personalNumber: e.target.value } : h
                                      ))}
                                      placeholder="ÅÅÅÅMMDD-NNNN"
                                      required
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Add Handledare Button */}
                            <Button
                              onClick={() => setHandledareInfo(prev => [...prev, {
                                name: '',
                                email: '',
                                phone: '',
                                personalNumber: ''
                              }])}
                              variant="outline"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              + Lägg till ytterligare handledare
                            </Button>
                          </div>
                        </div>
                      )}
                        
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

                  {/* Guest User Information Display */}
                  {!user && bookingData?.guestName && (
                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700 mb-2">
                        Gästbokning - Dina uppgifter:
                      </Label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-blue-800">Namn:</span> {bookingData.guestName}
                          </div>
                          <div>
                            <span className="font-medium text-blue-800">E-post:</span> {bookingData.guestEmail}
                          </div>
                          <div>
                            <span className="font-medium text-blue-800">Telefon:</span> {bookingData.guestPhone}
                          </div>
                          <div>
                            <span className="font-medium text-blue-800">Personnummer:</span> {bookingData.guestPersonalNumber}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Handledare Information Display */}
                  {bookingData?.handledare && bookingData.handledare.length > 0 && (
                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700 mb-2">
                        Handledare som deltar:
                      </Label>
                      <div className="space-y-2">
                        {bookingData.handledare.map((handledare, index) => (
                          <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm flex-1">
                                <div>
                                  <span className="font-medium text-green-800">Namn:</span> {handledare.name}
                                </div>
                                <div>
                                  <span className="font-medium text-green-800">E-post:</span> {handledare.email}
                                </div>
                                <div>
                                  <span className="font-medium text-green-800">Telefon:</span> {handledare.phone}
                                </div>
                                <div>
                                  <span className="font-medium text-green-800">Personnummer:</span> {handledare.personalNumber}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Handledare Selection for Teori Sessions */}
                  {(selectedLessonType?.type === 'teori' || selectedLessonType?.type === 'handledar') && 
                   selectedLessonType?.allowsSupervisors && (
                    <div className="mb-6">
                      <div className="mb-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Handledare för denna session:
                        </Label>
                      </div>

                      {/* Selected Handledare Display */}
                      {selectedHandledare.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {selectedHandledare.map((handledare, index) => (
                            <div key={handledare.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center">
                                <img 
                                  className="w-8 h-8 me-3 rounded-full border-2 border-blue-300"
                                  src={handledare.profilePicture || "/images/din-logo-small.png"} 
                                  alt={handledare.name}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/images/din-logo-small.png";
                                  }}
                                />
                                <div>
                                  <div className="text-sm font-medium text-blue-800">
                                    {handledare.name}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    {handledare.email}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedHandledare(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                Ta bort
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Student Selection Form */}
                      {showStudentForm && (
                        <div className="mt-4">
                          <StudentSelectionForm
                            selectedStudent={selectedStudent}
                            onStudentSelect={(student) => {
                              setSelectedStudent(student)
                              setShowStudentForm(false)
                              toast.success(student ? `Elev ${student.name} vald` : 'Elevval avbrutet')
                            }}
                            userIsStudent={user?.role === 'student'}
                            user={user ? {
                              id: user.id,
                              name: user.firstName + ' ' + user.lastName,
                              email: user.email,
                              phone: user.phone,
                              role: user.role
                            } : null}
                            onClose={() => setShowStudentForm(false)}
                            sessionType={selectedLessonType?.type || 'lesson'}
                          />
                        </div>
                      )}

                      {/* Student Selection Button */}
                      {user && user.role !== 'student' && !showStudentForm && !selectedStudent && (
                      <Button
                          onClick={() => setShowStudentForm(true)}
                        variant="outline"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Välj elev
                      </Button>
                      )}

                      {/* Dynamic Handledare Form */}
                      {showDynamicHandledareForm && (
                        <div className="mt-4">
                          <DynamicHandledareForm
                            handledare={handledareList}
                            onChange={setHandledareList}
                            maxSpots={selectedSession?.maxParticipants || 20}
                            currentOccupancy={selectedSession?.currentParticipants || 0}
                            sessionType={selectedLessonType?.type || 'teori'}
                            onClose={() => setShowDynamicHandledareForm(false)}
                          />
                        </div>
                      )}

                      {/* Add Handledare Button */}
                      {!showDynamicHandledareForm && (
                              <Button
                          onClick={() => setShowDynamicHandledareForm(true)}
                                variant="outline"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                          + Lägg till handledare
                              </Button>
                      )}

                      {/* Handledare Requirement Warning */}
                      {selectedLessonType?.type === 'handledar' && handledareList.length === 0 && (
                        <div className="mt-2 text-sm text-blue-600 flex items-center">
                          <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-blue-600 text-xs">i</span>
                          </span>
                          Minst 1 handledare krävs för denna session
                        </div>
                      )}
                    </div>
                                        )}

                      {/* Student Information Display */}
                      {(selectedStudent || selectedUser || effectiveUserDisplay) && (
                        <div className="mb-6">
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Bokad för:
                          </Label>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <User className="w-5 h-5 text-green-600" />
                              <div>
                                <div className="font-medium text-green-800">
                                  {selectedStudent?.name ||
                                   selectedUser?.name ||
                                   effectiveUserDisplay?.name}
                                </div>
                                <div className="text-sm text-green-600">
                                  {selectedStudent?.email ||
                                   selectedUser?.email ||
                                   effectiveUserDisplay?.email}
                                </div>
                                {selectedStudent && (
                                  <Badge className="mt-1 bg-green-100 text-green-800 border-green-300">
                                    Elevkonto
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                                            {/* Handledare Information Display */}
                      {handledareList && handledareList.length > 0 && (
                        <div className="mb-6">
                          <Label className="text-sm font-medium text-gray-700 mb-2">
                            Handledare som deltar:
                          </Label>
                          <div className="space-y-2">
                            {handledareList.map((handledare, index) => (
                              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium text-blue-800">Namn:</span> {handledare.name}
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800">E-post:</span> {handledare.email}
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800">Telefon:</span> {handledare.phone}
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800">Personnummer:</span> {handledare.personalNumber}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
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
                          disabled={
                            loading ||
                            // For handledare sessions: require student + at least one complete handledare
                            (selectedLessonType?.type === 'handledar' && (
                              (!selectedStudent && !user) ||
                              handledareList.length === 0 ||
                              handledareList.some(h =>
                                !h.name.trim() || !h.email.trim() || !h.phone.trim() || !h.personalNumber.trim()
                              )
                            )) ||
                            // For non-student users: require student selection
                            (user && user.role !== 'student' && !selectedStudent)
                          }
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loading ? (
                            <OrbSpinner size="sm" className="mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          {loading ? 'Behandlar...' : 'Bekräfta bokning'}
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
                        setGuestInfo({ name: '', email: '', phone: '', personalNumber: '' })
                        setHandledareInfo([])
                        // Reset new state variables
                        setHandledareList([])
                        setShowDynamicHandledareForm(false)
                        setSelectedStudent(null)
                        setShowStudentForm(false)
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
          
          {/* User Menu */}
                        {currentStep === 'complete' && bookingData && (
            <div className="mt-8 flex justify-center">
              <Dropdown
                label={
                  <Button variant="outline" className="flex items-center gap-2">
                    <MoreVertical className="w-4 h-4" />
                    Alternativ
                  </Button>
                }
                placement="top"
              >
                <DropdownItem
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/booking/mark-as-paid', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          bookingId: bookingData.bookingId,
                          paymentMethod: 'swish'
                        })
                      })

                      if (response.ok) {
                        toast.success('Betalning markerad som genomförd med Swish')
                      } else {
                        const errorData = await response.json()
                        toast.error(errorData.error || 'Kunde inte markera betalning')
                      }
                    } catch (error) {
                      toast.error('Ett fel uppstod')
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Jag har betalat med Swish
                </DropdownItem>
                <DropdownItem
                  onClick={async () => {
                    if (confirm('Är du säker på att du vill avboka denna lektion?')) {
                      try {
                        const url = new URL('/api/booking/cleanup', window.location.origin)
                        url.searchParams.set('bookingId', bookingData.bookingId)
                        url.searchParams.set('sessionType', selectedLessonType?.type || 'lesson')
                        url.searchParams.set('reason', 'User cancelled from booking page')

                        const response = await fetch(url.toString(), {
                          method: 'DELETE'
                        })

                        if (response.ok) {
                          toast.success('Bokningen har avbokats')
                          setCurrentStep('lesson-selection')
                          setBookingData(null)
                          setSelectedLessonType(null)
                          setGuestInfo({ name: '', email: '', phone: '', personalNumber: '' })
                          setHandledareInfo([])
                        } else {
                          const errorData = await response.json()
                          toast.error(errorData.error || 'Kunde inte avboka bokningen')
                        }
                      } catch (error) {
                        toast.error('Ett fel uppstod vid avbokning')
                      }
                    }
                  }}
                  className="flex items-center gap-2 text-red-600"
                >
                  <X className="w-4 h-4" />
                  Avboka denna bokning
                </DropdownItem>
              </Dropdown>
            </div>
          )}
          
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