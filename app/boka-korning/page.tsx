'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  User,
  CreditCard,
  Timer,
  AlertTriangle,
  BookOpen,
  Car,
  Users
} from 'lucide-react';
import { LessonSelection } from '@/components/booking/lesson-selection';
import { WeekCalendar } from '@/components/booking/week-calendar';
import { BookingConfirmation } from '@/components/booking/booking-confirmation';
import { GearSelection } from '@/components/booking/GearSelection';
import { SessionSelection } from '@/components/booking/session-selection';
import { BookingSteps } from '@/components/booking/booking-steps';
import { StudentSelection } from '@/components/booking/student-selection';
import { GuestRegistration } from '@/components/booking/guest-registration';
import { SupervisorInfo } from '@/components/booking/supervisor-info';
import { OrbSpinner } from '@/components/ui/orb-loader';
import { TempBookingStorage } from '@/lib/temp-booking';
import Link from 'next/link';

interface SessionType {
  id: string;
  type: 'lesson' | 'handledar' | 'teori';
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  priceStudent?: number;
  isActive: boolean;
  allowsSupervisors?: boolean;
  requiresPersonalId?: boolean;
  pricePerSupervisor?: number;
  maxParticipants?: number;
  sessions?: TeoriSession[];
  hasAvailableSessions?: boolean;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personalNumber?: string;
  phone?: string;
}

interface GuestData {
  firstName: string;
  lastName: string;
  personalNumber: string;
  email: string;
  phone: string;
}

interface Supervisor {
  id: string;
  firstName: string;
  lastName: string;
  personalNumber: string;
  email: string;
  phone: string;
  relationship: string;
}

interface TeoriSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  availableSpots: number;
  formattedDateTime: string;
}

interface BookingData {
  id?: string;
  tempBookingId?: string;
  lessonType: SessionType;
  selectedDate: Date;
  selectedTime: string;
  instructor: any | null;
  vehicle: any | null;
  totalPrice: number;
  isStudent: boolean;
  isHandledarutbildning: boolean;
  transmissionType?: "manual" | "automatic" | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  bookingId?: string;
  selectedSession?: TeoriSession;
}

type BookingStep = 'lesson-selection' | 'calendar' | 'gear-selection' | 'session-selection' | 'student-selection' | 'guest-registration' | 'supervisor-info' | 'confirmation' | 'payment-timer';

export default function BookingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<BookingStep>('lesson-selection');
  const [selectedLessonType, setSelectedLessonType] = useState<SessionType | null>(null);
  const [transmissionType, setTransmissionType] = useState<"manual" | "automatic" | null>('manual');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [selectedSession, setSelectedSession] = useState<TeoriSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Handledarutbildning state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);

  // Payment timer state
  const [paymentTimeLeft, setPaymentTimeLeft] = useState<number | null>(null);
  const [paymentTimerActive, setPaymentTimerActive] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  // Check for temporary booking data on mount
  useEffect(() => {
    const tempBooking = TempBookingStorage.get();
    if (tempBooking) {
      // Restore booking state from temporary storage
      setBookingData(tempBooking.bookingData);
      setSelectedSession(tempBooking.selectedSession);
      setSelectedLessonType(tempBooking.bookingData.lessonType);
      setGuestData(tempBooking.guestData || null);
      setSupervisors(tempBooking.supervisors || []);

      // Determine which step to show based on the restored data
      if (tempBooking.bookingData.isHandledarutbildning) {
        if (!user && !tempBooking.guestData) {
          setCurrentStep('guest-registration');
        } else if (user?.role === 'admin' && !tempBooking.bookingData.studentId) {
          setCurrentStep('student-selection');
        } else if (!tempBooking.supervisors || tempBooking.supervisors.length === 0) {
          setCurrentStep('supervisor-info');
        } else {
          setCurrentStep('confirmation');
        }
      } else {
        setCurrentStep('confirmation');
      }
    }
  }, [user]);

  // Calculate dynamic price
  const calculatePrice = (lessonType: SessionType): number => {
    let basePrice: number;

    if (user?.role === 'student' && lessonType.priceStudent) {
      basePrice = lessonType.priceStudent;
    } else {
      basePrice = lessonType.price;
    }

    return basePrice;
  };

  // Calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Handle lesson selection
  const handleLessonSelection = (data: { sessionType: SessionType }) => {
    setSelectedLessonType(data.sessionType);
    setCurrentPage(1); // Reset pagination

    if (data.sessionType.type === 'teori' || data.sessionType.type === 'handledar') {
      // Always go to session-selection; component will render empty state if none
      setCurrentStep('session-selection');
    } else {
      setCurrentStep('gear-selection');
    }
  };

  // Handle student selection for admin handledarutbildning booking
  const handleStudentSelection = (student: Student | null) => {
    setSelectedStudent(student);
    if (student) {
      // Update booking data with selected student
      if (bookingData) {
        const updatedBookingData = {
          ...bookingData,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          studentEmail: student.email,
          studentPhone: student.phone,
          studentPersonalNumber: student.personalNumber
        };
        setBookingData(updatedBookingData);
        TempBookingStorage.updateBookingData(updatedBookingData);
      }
      setCurrentStep('supervisor-info');
    }
  };

  // Handle adding new student
  const handleAddNewStudent = () => {
    setShowNewStudentForm(true);
    setCurrentStep('guest-registration');
  };

  // Handle creating new student
  const handleCreateNewStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });

      if (response.ok) {
        const result = await response.json();
        const newStudent: Student = {
          id: result.student.id,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email,
          personalNumber: studentData.personalNumber,
          phone: studentData.phone
        };

        // Select the newly created student
        handleStudentSelection(newStudent);

        // Refresh the students list
        // This would normally be done by updating the StudentSelection component
        // but for now we'll just proceed
      } else {
        throw new Error('Failed to create student');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  };

  // Handle guest registration
  const handleGuestRegistration = (data: GuestData) => {
    setGuestData(data);

    if (bookingData) {
      const updatedBookingData = {
        ...bookingData,
        guestName: `${data.firstName} ${data.lastName}`,
        guestEmail: data.email,
        guestPhone: data.phone,
        guestPersonalNumber: data.personalNumber
      };
      setBookingData(updatedBookingData);
      TempBookingStorage.updateGuestData(data);
      TempBookingStorage.updateBookingData(updatedBookingData);
    }

    setCurrentStep('supervisor-info');
  };

  // Handle supervisor information
  const handleSupervisorUpdate = (supervisorsList: Supervisor[]) => {
    // Check participant limits
    if (selectedSession) {
      const totalParticipants = 1 + supervisorsList.length; // 1 student + supervisors
      if (totalParticipants > selectedSession.maxParticipants) {
        toast.error(`För många deltagare! Max ${selectedSession.maxParticipants} deltagare tillåtet.`);
        return;
      }
    }

    setSupervisors(supervisorsList);
    TempBookingStorage.updateSupervisors(supervisorsList);

    // Update booking price if supervisors changed
    if (bookingData && bookingData.isHandledarutbildning) {
      const extraSupervisors = Math.max(0, supervisorsList.length - 1);
      const extraSupervisorCost = selectedSession?.pricePerSupervisor || 0;
      const additionalCost = extraSupervisors * extraSupervisorCost;
      const newTotalPrice = (selectedSession?.price || 0) + additionalCost;

      const updatedBookingData = {
        ...bookingData,
        totalPrice: newTotalPrice
      };
      setBookingData(updatedBookingData);
      TempBookingStorage.updateBookingData(updatedBookingData);
    }

    setCurrentStep('confirmation');
  };

  // Handle calendar selection
  const handleCalendarSelection = (data: { selectedDate: Date; selectedTime: string; bookingId?: string }) => {
    if (selectedLessonType) {
      const endTime = calculateEndTime(data.selectedTime, selectedLessonType.durationMinutes);
      const bookingData: BookingData = {
        id: data.bookingId,
        lessonType: selectedLessonType,
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        instructor: null,
        vehicle: null,
        totalPrice: calculatePrice(selectedLessonType),
        isStudent: user?.role === 'student',
        isHandledarutbildning: selectedLessonType.type === 'handledar',
        transmissionType: transmissionType,
        scheduledDate: data.selectedDate.toISOString().split('T')[0],
        startTime: data.selectedTime,
        endTime: endTime,
        durationMinutes: selectedLessonType.durationMinutes,
        bookingId: data.bookingId,
        tempBookingId: data.bookingId,
      };
      setBookingData(bookingData);
      setCurrentStep('confirmation');
    }
  };

  // Handle gear selection
  const handleGearSelection = (data: { transmissionType: "manual" | "automatic" }) => {
    setTransmissionType(data.transmissionType);
    setCurrentStep('calendar');
  };

  // Handle session selection
  const handleSessionSelection = (session: TeoriSession) => {
    if (selectedLessonType) {
      setSelectedSession(session);
      // Detect if this is a handledarutbildning based on lesson type settings
      const isHandledarutbildning = session.allows_supervisors || selectedLessonType.type === 'handledar';

      // Calculate price including extra supervisors
      let totalPrice = session.price || 0;
      if (isHandledarutbildning && supervisors.length > 1) {
        const extraSupervisors = supervisors.length - 1;
        const extraSupervisorCost = session.pricePerSupervisor || 0;
        totalPrice += extraSupervisors * extraSupervisorCost;
      }

      // Ensure we have a valid Date object
      let sessionDate: Date;
      if (session.date instanceof Date) {
        sessionDate = session.date;
      } else if (typeof session.date === 'string') {
        sessionDate = new Date(session.date + 'T00:00:00'); // Ensure it's parsed as local date
      } else {
        sessionDate = new Date(session.date);
      }

      if (isNaN(sessionDate.getTime())) {
        console.error('Invalid date from session:', session.date, typeof session.date);
        toast.error('Ogiltigt datum från sessionen');
        return;
      }

      const bookingData: BookingData = {
        lessonType: selectedLessonType,
        selectedDate: sessionDate,
        selectedTime: session.startTime,
        instructor: null,
        vehicle: null,
        totalPrice: totalPrice,
        isStudent: user?.role === 'student',
        isHandledarutbildning: isHandledarutbildning,
        transmissionType: transmissionType,
        scheduledDate: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes || selectedLessonType.durationMinutes,
        selectedSession: session,
        tempBookingId: session.id,
      };
      setBookingData(bookingData);

      // Save to temporary storage
      TempBookingStorage.save(bookingData, session, null, []);

      // Determine next step based on handledarutbildning requirements
      if (isHandledarutbildning) {
        if (!user) {
          // Guest user - need registration
          setCurrentStep('guest-registration');
        } else if (user.role === 'admin') {
          // Admin user - can select existing student or add new
          setCurrentStep('student-selection');
        } else {
          // Regular logged-in user - add as student, go to supervisor info
          const userAsStudent = {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            personalNumber: (user as any).personalNumber,
            phone: user.phone
          };
          handleStudentSelection(userAsStudent);
        }
      } else {
        // Regular teori session - go directly to confirmation
        setCurrentStep('confirmation');
      }
    }
  };

  // Handle booking confirmation - THIS IS WHERE WE INTEGRATE WITH PAYMENT HUB
  const handleBookingComplete = async () => {
    setLoading(true);

    try {
      if (!bookingData) {
        toast.error('Ingen bokningsdata tillgänglig.');
        return;
      }

      // Create booking first
      const apiBookingData = {
        sessionId: bookingData.lessonType.id,
        sessionType: bookingData.lessonType.type,
        scheduledDate: bookingData.scheduledDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        durationMinutes: bookingData.durationMinutes,
        totalPrice: bookingData.totalPrice,
        paymentMethod: 'pending',
        paymentStatus: 'pending',
        transmissionType: bookingData.transmissionType,
      };

      const bookingResponse = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBookingData),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const bookingResult = await bookingResponse.json();

      // Create invoice for the booking
      const invoiceResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingResult.booking.id,
          amount: bookingData.totalPrice,
          description: `${selectedLessonType?.name} - ${new Date(bookingData.scheduledDate).toLocaleDateString('sv-SE')}`,
          dueDate: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 120 minutes from now
        }),
      });

      if (!invoiceResponse.ok) {
        console.error('Failed to create invoice');
        // Continue anyway, booking was created
      } else {
        const invoiceResult = await invoiceResponse.json();
        setInvoiceId(invoiceResult.invoice.id);

        // Start payment timer for non-logged-in users or non-students
        if (!user || user.role !== 'student') {
          startPaymentTimer();
        }

        // Redirect to Payment Hub with invoice ID
        router.push(`/betalhubben/${invoiceResult.invoice.id}`);
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Ett fel uppstod när bokningen skulle skapas. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  // Payment timer functionality
  const startPaymentTimer = () => {
    const timeLimit = 120 * 60; // 120 minutes in seconds
    setPaymentTimeLeft(timeLimit);
    setPaymentTimerActive(true);

    // Update timer every second
    const interval = setInterval(() => {
      setPaymentTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setPaymentTimerActive(false);
          handlePaymentTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePaymentTimeout = async () => {
    if (bookingData?.bookingId && invoiceId) {
      try {
        // Use the dedicated payment timeout cleanup endpoint
        const response = await fetch('/api/booking/payment-timeout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingData.bookingId,
            invoiceId: invoiceId,
            reason: 'Payment timeout - 120 minutes expired'
          }),
        });

        if (response.ok) {
          toast.error('Betalningstiden har gått ut. Bokningen har avbokats.');
          setCurrentStep('lesson-selection');
          setBookingData(null);
          setInvoiceId(null);
          setPaymentTimerActive(false);
          setPaymentTimeLeft(null);
        } else {
          console.error('Failed to cleanup payment timeout');
        }
      } catch (error) {
        console.error('Error during payment timeout cleanup:', error);
      }
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'calendar':
        setCurrentStep('lesson-selection');
        break;
      case 'gear-selection':
        setCurrentStep('calendar');
        break;
      case 'session-selection':
        setCurrentStep('lesson-selection');
        break;
      case 'student-selection':
        setCurrentStep('session-selection');
        break;
      case 'guest-registration':
        if (user?.role === 'admin') {
          setCurrentStep('student-selection');
        } else {
          setCurrentStep('session-selection');
        }
        break;
      case 'supervisor-info':
        if (user?.role === 'admin') {
          setCurrentStep('student-selection');
        } else if (!user) {
          setCurrentStep('guest-registration');
        } else {
          setCurrentStep('session-selection');
        }
        break;
      case 'confirmation':
        if (bookingData?.isHandledarutbildning && supervisors.length === 0) {
          setCurrentStep('supervisor-info');
        } else if (selectedLessonType?.type === 'teori' || selectedLessonType?.type === 'handledar') {
          setCurrentStep('session-selection');
        } else {
          setCurrentStep('calendar');
        }
        break;
      case 'payment-timer':
        setCurrentStep('confirmation');
        break;
      default:
        setCurrentStep('lesson-selection');
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 'lesson-selection':
        return !!selectedLessonType;
      case 'gear-selection':
        return !!transmissionType;
      case 'calendar':
        return !!bookingData?.selectedDate && !!bookingData?.selectedTime;
      case 'session-selection':
        return !!selectedSession;
      case 'student-selection':
        return !!selectedStudent;
      case 'guest-registration':
        return !!guestData;
      case 'supervisor-info':
        return supervisors.length > 0;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const handleContinue = () => {
    if (currentStep === 'confirmation') {
      handleBookingComplete();
    } else {
      // Navigate to next step logic would go here
      // For now, we'll let the individual components handle navigation
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'lesson-selection':
        return 'Välj typ av lektion';
      case 'calendar':
        return 'Välj datum och tid';
      case 'gear-selection':
        return 'Välj växellåda';
      case 'session-selection':
        return 'Välj session';
      case 'student-selection':
        return 'Välj elev';
      case 'guest-registration':
        return 'Registrera elev';
      case 'supervisor-info':
        return 'Handledarinformation';
      case 'confirmation':
        return 'Bekräfta bokning';
      case 'payment-timer':
        return 'Betala inom tidsfristen';
      default:
        return 'Boka lektion';
    }
  };

  const getDynamicSteps = () => {
    const baseSteps = [
      { number: 1, title: 'Välj lektion' }
    ];

    if (selectedLessonType) {
      if (selectedLessonType.type === 'teori' || selectedLessonType.type === 'handledar') {
        baseSteps.push({ number: 2, title: 'Välj session' });

        // Add steps for handledarutbildning
        if (bookingData?.isHandledarutbildning) {
          if (!user) {
            baseSteps.push({ number: 3, title: 'Registrera' });
          } else if (user?.role === 'admin') {
            baseSteps.push({ number: 3, title: 'Välj elev' });
          }
          baseSteps.push({ number: 4, title: 'Handledare' });
          baseSteps.push({ number: 5, title: 'Bekräfta' });
        } else {
          baseSteps.push({ number: 3, title: 'Bekräfta' });
        }
      } else {
        baseSteps.push({ number: 2, title: 'Växellåda' });
        baseSteps.push({ number: 3, title: 'Datum & tid' });
        baseSteps.push({ number: 4, title: 'Bekräfta' });
      }
    }

    return baseSteps;
  };

  const getCurrentStepNumber = () => {
    switch (currentStep) {
      case 'lesson-selection':
        return 1;
      case 'gear-selection':
        return 2;
      case 'calendar':
        return selectedLessonType?.type === 'teori' || selectedLessonType?.type === 'handledar' ? 2 : 3;
      case 'session-selection':
        return 2;
      case 'student-selection':
        return 3;
      case 'guest-registration':
        return 3;
      case 'supervisor-info':
        return bookingData?.isHandledarutbildning ? 4 : 3;
      case 'confirmation':
        if (bookingData?.isHandledarutbildning) {
          return 5;
        } else if (selectedLessonType?.type === 'teori' || selectedLessonType?.type === 'handledar') {
          return 3;
        } else {
          return 4;
        }
      default:
        return 1;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <OrbSpinner size="lg" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Laddar bokningssystemet...</h2>
            <p className="text-gray-600">Hämtar tillgängliga lektioner</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-red-100">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Timer Alert */}
        {paymentTimerActive && paymentTimeLeft !== null && (
          <Card className="mb-8 border-2 border-red-300 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    ⏰ Betalning krävs inom {formatTimeLeft(paymentTimeLeft)}
                  </h3>
                  <p className="text-red-700 text-sm">
                    Eftersom du inte är inloggad som student har du 120 minuter på dig att betala.
                    Om tiden går ut kommer bokningen att avbokas automatiskt.
                  </p>
                </div>
                {invoiceId && (
                  <Button
                    onClick={() => router.push(`/betalhubben/${invoiceId}`)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Betala nu
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps Indicator */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardContent className="p-6">
            <BookingSteps 
              currentStep={getCurrentStepNumber()} 
              steps={getDynamicSteps()} 
            />
          </CardContent>
        </Card>

        {/* Step Title */}
        <Card className="mb-8 bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6" />
              <h1 className="text-2xl font-bold">{getStepTitle()}</h1>
            </div>
            {selectedLessonType && (
              <Badge className="bg-white/20 text-white border-white/30">
                {selectedLessonType.name}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            {currentStep === 'lesson-selection' && (
              <LessonSelection onComplete={handleLessonSelection} />
            )}

            {currentStep === 'calendar' && selectedLessonType && (
              <div className="space-y-6">
                <WeekCalendar
                  lessonType={selectedLessonType}
                  transmissionType={transmissionType}
                  totalPrice={calculatePrice(selectedLessonType)}
                  onComplete={handleCalendarSelection}
                  onBack={handleBack}
                />

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tillbaka
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!canContinue()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Fortsätt
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'gear-selection' && selectedLessonType && (
              <div className="space-y-6">
                <GearSelection
                  lessonTypeName={selectedLessonType.name}
                  onComplete={handleGearSelection}
                  onBack={handleBack}
                />

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tillbaka
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!canContinue()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Fortsätt
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'session-selection' && selectedLessonType && (
              <div className="space-y-6">
                <SessionSelection
                  sessionType={{ ...selectedLessonType, basePrice: selectedLessonType.price } as any}
                  onComplete={(data) => {
                    const normalized: TeoriSession = {
                      id: data.session.id,
                      title: data.session.title,
                      description: (data.session as any).description || '',
                      date: (data.session as any).date,
                      startTime: (data.session as any).startTime,
                      endTime: (data.session as any).endTime,
                      maxParticipants: (data.session as any).maxParticipants,
                      currentParticipants: (data.session as any).currentParticipants,
                      // Use lesson type price (session-specific pricing needs DB migration)
                      price: (data.session as any).price || 0,
                      availableSpots: (data.session as any).availableSpots ?? ((data.session as any).maxParticipants - ((data.session as any).currentParticipants || 0) - (((data.session as any).bookedCount) || 0)),
                      formattedDateTime: (data.session as any).formattedDateTime || '',
                      allows_supervisors: (data.session as any).allowsSupervisors || false,
                    };
                    setSelectedSession(normalized);
                    handleSessionSelection(normalized);
                  }}
                  onBack={handleBack}
                />

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tillbaka
                  </Button>
                  <Button
                    onClick={() => handleSessionSelection(selectedSession!)}
                    disabled={!selectedSession}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Fortsätt
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'student-selection' && (
              <div className="space-y-6">
                <StudentSelection
                  onSelectStudent={handleStudentSelection}
                  onAddNewStudent={handleAddNewStudent}
                  onCreateNewStudent={handleCreateNewStudent}
                  selectedStudent={selectedStudent}
                />

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tillbaka
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedStudent) {
                        handleStudentSelection(selectedStudent);
                      }
                    }}
                    disabled={!selectedStudent}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Fortsätt
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'guest-registration' && (
              <div className="space-y-6">
                <GuestRegistration
                  onSubmit={handleGuestRegistration}
                  onBack={handleBack}
                  existingEmail={bookingData?.guestEmail}
                />

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tillbaka
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'supervisor-info' && (
              <div className="space-y-6">
                <SupervisorInfo
                  supervisors={supervisors}
                  onUpdateSupervisors={handleSupervisorUpdate}
                  maxSupervisors={1}
                />

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tillbaka
                  </Button>
                  <Button
                    onClick={() => handleSupervisorUpdate(supervisors)}
                    disabled={supervisors.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Fortsätt
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'confirmation' && selectedLessonType && bookingData && (
              <BookingConfirmation
                bookingData={bookingData as any}
                user={user}
                onBack={handleBack}
                onComplete={async ({ paymentMethod, studentId, alreadyPaid, guestName, guestEmail, guestPhone, totalPrice }) => {
                  try {
                    setLoading(true);
                    const apiBookingData = {
                      sessionId: bookingData.lessonType.id,
                      sessionType: bookingData.lessonType.type,
                      scheduledDate: bookingData.scheduledDate,
                      startTime: bookingData.startTime,
                      endTime: bookingData.endTime,
                      durationMinutes: bookingData.durationMinutes,
                      totalPrice: totalPrice ?? bookingData.totalPrice,
                      paymentMethod: paymentMethod || 'pending',
                      paymentStatus: alreadyPaid ? 'paid' : 'pending',
                      transmissionType: bookingData.transmissionType,
                      studentId,
                      guestName,
                      guestEmail,
                      guestPhone,
                      guestPersonalNumber: guestData?.personalNumber,
                      teoriSessionId: bookingData.selectedSession?.id,
                      supervisors: supervisors,
                    } as any;

                    const bookingResponse = await fetch('/api/booking/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(apiBookingData),
                    });

                    if (!bookingResponse.ok) {
                      const errorData = await bookingResponse.json().catch(() => ({}));
                      throw new Error(errorData.error || 'Failed to create booking');
                    }

                    const bookingResult = await bookingResponse.json();

                    if (!alreadyPaid) {
                      const invoiceResponse = await fetch('/api/invoices', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          bookingId: bookingResult.booking.id,
                          amount: totalPrice ?? bookingData.totalPrice,
                          description: `${selectedLessonType?.name} - ${new Date(bookingData.scheduledDate).toLocaleDateString('sv-SE')}`,
                          dueDate: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
                        }),
                      });

                      if (invoiceResponse.ok) {
                        const invoiceResult = await invoiceResponse.json();
                        setInvoiceId(invoiceResult.invoice.id);
                        if (!user || user.role !== 'student') {
                          startPaymentTimer();
                        }
                        router.push(`/betalhubben/${invoiceResult.invoice.id}`);
                        return;
                      }
                    }

                    router.push('/booking/success');
                  } catch (error) {
                    console.error('Error completing booking:', error);
                    toast.error('Ett fel uppstod när bokningen skulle slutföras. Försök igen.');
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Har du frågor? Kontakta oss på{' '}
            <a href="tel:0760389192" className="text-red-600 hover:underline font-medium">
              0760-389192
            </a>{' '}
            eller{' '}
            <a href="mailto:info@dintrafikskolahlm.se" className="text-red-600 hover:underline font-medium">
              info@dintrafikskolahlm.se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}