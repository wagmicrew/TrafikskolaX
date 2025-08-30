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
  Users,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { LessonTypeSelection } from '@/components/booking/LessonTypeSelection';
import { DrivingCalendar } from '@/components/booking/DrivingCalendar';
import { TeoriSessionCards } from '@/components/booking/TeoriSessionCards';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { GearSelection } from '@/components/booking/GearSelection';
import { StudentSelection } from '@/components/booking/StudentSelection';
import { GuestRegistration } from '@/components/booking/GuestRegistration';
import { SupervisorManagement } from '@/components/booking/SupervisorManagement';
import { TempBookingStorage } from '@/lib/temp-booking';

// Types
interface LessonType {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  priceStudent?: number;
  isActive: boolean;
  allowsSupervisors?: boolean;
  pricePerSupervisor?: number;
}

interface TeoriLessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  price: number;
  pricePerSupervisor?: number;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
  sessions?: TeoriSession[];
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
  pricePerSupervisor?: number;
  availableSpots: number;
  formattedDateTime: string;
  allowsSupervisors: boolean;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personalNumber?: string;
  phone?: string;
}

interface Supervisor {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalNumber: string;
}

interface BookingData {
  id?: string;
  tempBookingId?: string;
  lessonType?: LessonType;
  teoriLessonType?: TeoriLessonType;
  teoriSession?: TeoriSession;
  selectedDate?: string;
  selectedTime?: string;
  transmissionType?: string;
  student?: Student;
  supervisors?: Supervisor[];
  totalPrice?: number;
}

type BookingStep =
  | 'lesson_selection'
  | 'driving_calendar'
  | 'teori_sessions'
  | 'gear_selection'
  | 'student_selection'
  | 'guest_registration'
  | 'supervisor_management'
  | 'confirmation';

export default function BokningshubbenPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // State management
  const [currentStep, setCurrentStep] = useState<BookingStep>('lesson_selection');
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [teoriLessonTypes, setTeoriLessonTypes] = useState<TeoriLessonType[]>([]);
  const [selectedLessonType, setSelectedLessonType] = useState<LessonType | null>(null);
  const [selectedTeoriLessonType, setSelectedTeoriLessonType] = useState<TeoriLessonType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load lesson types and teori lesson types
  useEffect(() => {
    loadLessonTypes();
    loadTeoriLessonTypes();
  }, []);

  const loadLessonTypes = async () => {
    try {
      const response = await fetch('/api/lesson-types');
      if (response.ok) {
        const data = await response.json();
        setLessonTypes(data.lessonTypes || []);
      }
    } catch (error) {
      console.error('Error loading lesson types:', error);
      toast.error('Kunde inte ladda lektionstyper');
    }
  };

  const loadTeoriLessonTypes = async () => {
    try {
      const response = await fetch('/api/teori/lesson-types');
      if (response.ok) {
        const data = await response.json();
        setTeoriLessonTypes(data.lessonTypes || []);
      }
    } catch (error) {
      console.error('Error loading teori lesson types:', error);
      toast.error('Kunde inte ladda teori lektionstyper');
    }
  };

  // Step navigation
  const goToNextStep = (step: BookingStep) => {
    setCurrentStep(step);
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'driving_calendar':
        setCurrentStep('lesson_selection');
        setSelectedLessonType(null);
        break;
      case 'teori_sessions':
        setCurrentStep('lesson_selection');
        setSelectedTeoriLessonType(null);
        break;
      case 'gear_selection':
        setCurrentStep('driving_calendar');
        break;
      case 'student_selection':
      case 'guest_registration':
        if (selectedLessonType) {
          setCurrentStep('gear_selection');
        } else if (selectedTeoriLessonType) {
          setCurrentStep('teori_sessions');
        }
        break;
      case 'supervisor_management':
        if (selectedTeoriLessonType?.allowsSupervisors) {
          setCurrentStep('teori_sessions');
        } else {
          setCurrentStep('student_selection');
        }
        break;
      case 'confirmation':
        if (selectedLessonType) {
          if (user?.role === 'admin' || user?.role === 'teacher') {
            setCurrentStep('student_selection');
          } else {
            setCurrentStep('gear_selection');
          }
        } else if (selectedTeoriLessonType) {
          if (selectedTeoriLessonType.allowsSupervisors) {
            setCurrentStep('supervisor_management');
          } else {
            setCurrentStep('student_selection');
          }
        }
        break;
      default:
        setCurrentStep('lesson_selection');
    }
  };

  // Handle lesson type selection
  const handleLessonTypeSelect = (lessonType: LessonType) => {
    setSelectedLessonType(lessonType);
    setBookingData(prev => ({ ...prev, lessonType }));
    goToNextStep('driving_calendar');
  };

  // Handle teori lesson type selection
  const handleTeoriLessonTypeSelect = (teoriLessonType: TeoriLessonType) => {
    setSelectedTeoriLessonType(teoriLessonType);
    setBookingData(prev => ({ ...prev, teoriLessonType }));
    goToNextStep('teori_sessions');
  };

  // Handle calendar slot selection
  const handleSlotSelect = (date: string, time: string) => {
    setBookingData(prev => ({ ...prev, selectedDate: date, selectedTime: time }));
    goToNextStep('gear_selection');
  };

  // Handle teori session selection
  const handleTeoriSessionSelect = (session: TeoriSession) => {
    setBookingData(prev => ({ ...prev, teoriSession: session }));

    if (selectedTeoriLessonType?.allowsSupervisors) {
      goToNextStep('supervisor_management');
    } else {
      goToNextStep('student_selection');
    }
  };

  // Handle gear selection
  const handleGearSelect = (transmissionType: string) => {
    setBookingData(prev => ({ ...prev, transmissionType }));

    if (user?.role === 'admin' || user?.role === 'teacher') {
      goToNextStep('student_selection');
    } else if (!user) {
      goToNextStep('guest_registration');
    } else {
      goToNextStep('confirmation');
    }
  };

  // Handle student selection (for admin/teacher)
  const handleStudentSelect = (student: Student) => {
    setBookingData(prev => ({ ...prev, student }));
    goToNextStep('confirmation');
  };

  // Handle guest registration
  const handleGuestRegister = (guestData: any) => {
    setBookingData(prev => ({ ...prev, ...guestData }));
    goToNextStep('confirmation');
  };

  // Handle supervisor management
  const handleSupervisorsComplete = (supervisors: Supervisor[]) => {
    setBookingData(prev => ({ ...prev, supervisors }));

    if (user?.role === 'admin' || user?.role === 'teacher') {
      goToNextStep('student_selection');
    } else if (!user) {
      goToNextStep('guest_registration');
    } else {
      goToNextStep('confirmation');
    }
  };

  // Handle booking confirmation
  const handleBookingConfirm = async () => {
    setIsLoading(true);
    try {
      // Create booking logic here
      const bookingPayload = {
        ...bookingData,
        userId: user?.id || bookingData.student?.id,
        paymentMethod: 'swish' // Default payment method
      };

      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Bokning skapad framgångsrikt!');

        // Redirect to payment hub
        router.push(`/betalhubben?id=${result.booking.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte skapa bokning');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Ett fel uppstod vid bokning');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Bokningshubben</h1>
              <Badge variant="secondary" className="bg-white text-red-600">
                TrafikskolaX
              </Badge>
            </div>

            {currentStep !== 'lesson_selection' && (
              <Button
                variant="ghost"
                onClick={goToPreviousStep}
                className="text-white hover:bg-red-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Tillbaka
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'lesson_selection' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Välj typ</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                ['driving_calendar', 'teori_sessions'].includes(currentStep) ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Välj tid</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'confirmation' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Bekräfta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {currentStep === 'lesson_selection' && (
          <LessonTypeSelection
            lessonTypes={lessonTypes}
            teoriLessonTypes={teoriLessonTypes}
            onLessonTypeSelect={handleLessonTypeSelect}
            onTeoriLessonTypeSelect={handleTeoriLessonTypeSelect}
          />
        )}

        {currentStep === 'driving_calendar' && selectedLessonType && (
          <DrivingCalendar
            lessonType={selectedLessonType}
            onSlotSelect={handleSlotSelect}
          />
        )}

        {currentStep === 'teori_sessions' && selectedTeoriLessonType && (
          <TeoriSessionCards
            lessonType={selectedTeoriLessonType}
            onSessionSelect={handleTeoriSessionSelect}
          />
        )}

        {currentStep === 'gear_selection' && (
          <GearSelection
            lessonType={selectedLessonType!}
            onGearSelect={handleGearSelect}
          />
        )}

        {currentStep === 'student_selection' && (
          <StudentSelection
            onStudentSelect={handleStudentSelect}
          />
        )}

        {currentStep === 'guest_registration' && (
          <GuestRegistration
            onGuestRegister={handleGuestRegister}
          />
        )}

        {currentStep === 'supervisor_management' && selectedTeoriLessonType && (
          <SupervisorManagement
            lessonType={selectedTeoriLessonType}
            selectedSession={bookingData.teoriSession!}
            onComplete={handleSupervisorsComplete}
          />
        )}

        {currentStep === 'confirmation' && (
          <BookingConfirmation
            bookingData={bookingData}
            user={user}
            onConfirm={handleBookingConfirm}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}
