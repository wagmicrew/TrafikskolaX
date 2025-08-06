"use client";

import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaCar, 
  FaClipboardList, 
  FaCommentDots, 
  FaUser,
  FaBars,
  FaTimes,
  FaChevronRight,
  FaEdit,
  FaSave,
  FaTrash,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
  FaPlus,
  FaCheck,
  FaCalendar,
  FaBookOpen,
  FaGraduationCap,
  FaChartLine,
  FaUserGraduate,
  FaFileAlt
} from 'react-icons/fa';
import Link from 'next/link';

interface Booking {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  lessonTypeName: string;
  transmissionType: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  isCompleted: boolean;
  durationMinutes: number;
  studentName?: string; // Student the lesson is for
  studentPhone?: string;
  studentEmail?: string;
  bookedBy?: string; // Who actually made the booking
}

interface BookingStep {
  id: number;
  stepNumber: number;
  category: string;
  subcategory: string;
  description: string;
}

interface LessonType {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TeacherDashboardClientProps {
  user: User;
}

interface FeedbackBookingsListProps {
  date: string;
  onBookingSelect: (booking: Booking) => void;
  getStatusColor: (status: string) => string;
  getTransmissionIcon: (transmission: string) => string;
  formatTime: (timeString: string) => string;
}

const FeedbackBookingsList: React.FC<FeedbackBookingsListProps> = ({ 
  date, 
  onBookingSelect, 
  getStatusColor, 
  getTransmissionIcon, 
  formatTime 
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/teacher/bookings?date=${date}`);
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (error) {
        console.error('Failed to fetch bookings for date:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [date]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <FaCalendarAlt className="text-4xl mx-auto mb-3 opacity-50" />
        <p>Inga lektioner denna dag</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                <h4 className="font-semibold text-white drop-shadow-sm">
                  {booking.studentName || booking.userName}
                </h4>
                <span className="text-xl">{getTransmissionIcon(booking.transmissionType)}</span>
              </div>
              <div className="text-sm text-white/80 space-y-1">
                <div className="flex items-center gap-2">
                  <FaClock className="text-white/60" />
                  <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCar className="text-white/60" />
                  <span>{booking.lessonTypeName}</span>
                </div>
                {booking.studentPhone && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-white/60" />
                    <span>{booking.studentPhone}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onBookingSelect(booking)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm flex items-center gap-2"
            >
              <FaEdit />
              Utbildningskort
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const TeacherDashboardClient: React.FC<TeacherDashboardClientProps> = ({ user }) => {
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingSteps, setBookingSteps] = useState<BookingStep[]>([]);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<{ [key: string]: { feedback: string; valuation: number } }>({});
  const [existingFeedback, setExistingFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'bookings' | 'feedback'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedbackDate, setFeedbackDate] = useState(new Date().toISOString().split('T')[0]);
  const [freetextFeedback, setFreetextFeedback] = useState({
    feedbackText: '',
    valuation: 5
  });

  useEffect(() => {
    fetchTodaysBookings();
    fetchAllBookings();
    fetchBookingSteps();
    fetchLessonTypes();
  }, []);

  const fetchTodaysBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/teacher/bookings?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setTodaysBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch today\'s bookings:', error);
      setTodaysBookings([]);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/teacher/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setAllBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch all bookings:', error);
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingSteps = async () => {
    try {
      const response = await fetch('/api/booking-steps');
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setBookingSteps(data.steps || []);
    } catch (error) {
      console.error('Failed to fetch booking steps:', error);
    }
  };

  const fetchLessonTypes = async () => {
    try {
      const response = await fetch('/api/teacher/lesson-types');
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setLessonTypes(data.lessonTypes || []);
    } catch (error) {
      console.error('Failed to fetch lesson types:', error);
    }
  };

  const fetchBookingsForDate = async (date: string) => {
    try {
      const response = await fetch(`/api/teacher/bookings?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      return data.bookings || [];
    } catch (error) {
      console.error('Failed to fetch bookings for date:', error);
      return [];
    }
  };

  const fetchExistingFeedback = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/teacher/feedback?bookingId=${bookingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setExistingFeedback(data.feedback || []);
      
      // Pre-populate existing feedback
      const feedbackMap: { [key: string]: { feedback: string; valuation: number } } = {};
      data.feedback?.forEach((item: any) => {
        if (item.stepIdentifier !== 'freetext') {
          feedbackMap[item.stepIdentifier] = {
            feedback: item.feedbackText || '',
            valuation: item.valuation || 5
          };
        } else {
          setFreetextFeedback({
            feedbackText: item.feedbackText || '',
            valuation: item.valuation || 5
          });
        }
      });
      setSelectedSteps(feedbackMap);
    } catch (error) {
      console.error('Failed to fetch existing feedback:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500';
      case 'on_hold': return 'bg-amber-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  const getTransmissionIcon = (transmission: string) => {
    return transmission === 'manual' ? '🚗' : '⚙️';
  };

  const handleStepFeedback = (stepId: string, feedback: string, valuation: number) => {
    setSelectedSteps(prev => ({
      ...prev,
      [stepId]: { feedback, valuation }
    }));
  };

  const saveFeedback = async () => {
    if (!selectedBooking) return;

    try {
      // Save step-based feedback
      for (const [stepId, data] of Object.entries(selectedSteps)) {
        if (data.feedback.trim()) {
          await fetch('/api/teacher/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId: selectedBooking.id,
              stepIdentifier: stepId,
              feedbackText: data.feedback,
              valuation: data.valuation,
            }),
          });
        }
      }

      // Save freetext feedback if provided
      if (freetextFeedback.feedbackText.trim()) {
        await fetch('/api/teacher/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: selectedBooking.id,
            feedbackText: freetextFeedback.feedbackText,
            valuation: freetextFeedback.valuation,
            isFreetext: true,
          }),
        });
      }

      alert('Feedback sparad!');
      setSelectedBooking(null);
      setSelectedSteps({});
      setFreetextFeedback({ feedbackText: '', valuation: 5 });
    } catch (error) {
      console.error('Failed to save feedback:', error);
      alert('Fel vid sparande av feedback');
    }
  };

  const unbookLesson = async (bookingId: string) => {
    if (!confirm('Är du säker på att du vill avboka denna lektion? Eleven kommer att få en kredit.')) {
      return;
    }

    try {
      await fetch(`/api/teacher/unbook/${bookingId}`, {
        method: 'POST',
      });
      fetchTodaysBookings();
      fetchAllBookings();
      alert('Lektion avbokad och kredit tilldelad eleven');
    } catch (error) {
      console.error('Failed to unbook lesson:', error);
      alert('Fel vid avbokning');
    }
  };

  const formatTime = (timeString: string) => {
    return timeString?.substring(0, 5) || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupStepsByCategory = (steps: BookingStep[]) => {
    return steps.reduce((acc, step) => {
      if (!acc[step.category]) {
        acc[step.category] = [];
      }
      acc[step.category].push(step);
      return acc;
    }, {} as { [key: string]: BookingStep[] });
  };

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedSteps({});
    setFreetextFeedback({ feedbackText: '', valuation: 5 });
    fetchExistingFeedback(booking.id);
  };

  const renderMobileMenu = () => (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden`}>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl w-80 h-full p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white drop-shadow-sm">Meny</h2>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        
        <nav className="space-y-3">
          <button
            onClick={() => { setActiveView('overview'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 ${
              activeView === 'overview' 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FaClipboardList />
            Översikt
          </button>
          
          <button
            onClick={() => { setActiveView('bookings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 ${
              activeView === 'bookings' 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FaCalendarAlt />
            Bokningar
          </button>
          
          <button
            onClick={() => { setActiveView('feedback'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 ${
              activeView === 'feedback' 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FaCommentDots />
            Feedback
          </button>
        </nav>
      </div>
    </div>
  );

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Dagens Lektioner</p>
            <p className="text-3xl font-bold text-white drop-shadow-sm">{todaysBookings.length}</p>
          </div>
          <FaCalendarAlt className="text-4xl text-white/60" />
        </div>
      </div>
      
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Totalt Bokningar</p>
            <p className="text-3xl font-bold text-white drop-shadow-sm">{allBookings.length}</p>
          </div>
          <FaUsers className="text-4xl text-white/60" />
        </div>
      </div>
      
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Genomförda Idag</p>
            <p className="text-3xl font-bold text-white drop-shadow-sm">
              {todaysBookings.filter(b => b.isCompleted).length}
            </p>
          </div>
          <FaCheck className="text-4xl text-white/60" />
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Väntande</p>
            <p className="text-3xl font-bold text-white drop-shadow-sm">
              {todaysBookings.filter(b => b.status === 'on_hold').length}
            </p>
          </div>
          <FaClock className="text-4xl text-white/60" />
        </div>
      </div>
    </div>
  );

  const renderTodaysBookings = () => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl mb-8">
      <h2 className="text-2xl font-bold text-white drop-shadow-sm mb-6 flex items-center gap-3">
        <FaCalendarAlt className="text-white/60" />
        Dagens Lektioner
      </h2>
      
      {todaysBookings.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <FaCalendarAlt className="text-6xl mx-auto mb-4 opacity-50" />
          <p className="text-lg">Inga lektioner idag</p>
          <p className="text-sm mt-2">Du kan ta emot bokningar från elever</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaysBookings.map((booking) => (
            <div key={booking.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                    <h3 className="font-semibold text-white drop-shadow-sm">
                      {booking.studentName || booking.userName}
                    </h3>
                    <span className="text-2xl">{getTransmissionIcon(booking.transmissionType)}</span>
                  </div>
                  
                  <div className="text-sm text-white/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-white/60" />
                      <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCar className="text-white/60" />
                      <span>{booking.lessonTypeName}</span>
                    </div>

                    {booking.studentPhone && (
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-white/60" />
                        <span>{booking.studentPhone}</span>
                      </div>
                    )}

                    {booking.bookedBy && booking.bookedBy !== (booking.studentName || booking.userName) && (
                      <div className="flex items-center gap-2">
                        <FaUser className="text-white/60" />
                        <span>Bokad av: {booking.bookedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleBookingSelect(booking)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <FaEdit />
                    Utbildningskort
                  </button>
                  
                  <button
                    onClick={() => unbookLesson(booking.id)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30 rounded-lg hover:border-red-400/50 transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <FaTrash />
                    Avboka
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAllBookings = () => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-white drop-shadow-sm mb-6 flex items-center gap-3">
        <FaCalendarAlt className="text-white/60" />
        Alla Bokningar
      </h2>
      
      <div className="mb-6">
        <label className="text-white/80 text-sm font-medium mb-2 block">Filtrera efter datum:</label>
        <div className="flex gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => setSelectedDate('')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm"
          >
            Visa alla
          </button>
        </div>
      </div>

      {allBookings.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <FaCalendarAlt className="text-6xl mx-auto mb-4 opacity-50" />
          <p className="text-lg">Inga bokningar hittades</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allBookings
            .filter(booking => !selectedDate || booking.scheduledDate === selectedDate)
            .map((booking) => (
            <div key={booking.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                    <h3 className="font-semibold text-white drop-shadow-sm">
                      {booking.studentName || booking.userName}
                    </h3>
                    <span className="text-2xl">{getTransmissionIcon(booking.transmissionType)}</span>
                  </div>
                  
                  <div className="text-sm text-white/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-white/60" />
                      <span>{formatDate(booking.scheduledDate)} • {formatTime(booking.startTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCar className="text-white/60" />
                      <span>{booking.lessonTypeName}</span>
                    </div>

                    {booking.bookedBy && booking.bookedBy !== (booking.studentName || booking.userName) && (
                      <div className="flex items-center gap-2">
                        <FaUser className="text-white/60" />
                        <span>Bokad av: {booking.bookedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleBookingSelect(booking)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <FaEdit />
                    Utbildningskort
                  </button>
                  
                  <button
                    onClick={() => unbookLesson(booking.id)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30 rounded-lg hover:border-red-400/50 transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <FaTrash />
                    Avboka
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBookingSteps = () => {
    if (!selectedBooking) return null;

    const groupedSteps = groupStepsByCategory(bookingSteps);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white drop-shadow-sm">
                Utbildningskort - {selectedBooking.studentName || selectedBooking.userName}
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-white/80 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(groupedSteps).map(([category, steps]) => (
                <div key={category} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-white drop-shadow-sm mb-3">
                    {steps[0]?.stepNumber}. {category}
                  </h3>
                  
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                        <h4 className="font-medium text-white/90 mb-2">
                          {step.subcategory}
                        </h4>
                        
                        <textarea
                          placeholder="Lägg till feedback..."
                          className="w-full p-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded text-sm resize-none"
                          rows={2}
                          value={selectedSteps[step.id]?.feedback || ''}
                          onChange={(e) => handleStepFeedback(
                            step.id.toString(), 
                            e.target.value, 
                            selectedSteps[step.id]?.valuation || 5
                          )}
                        />
                        
                        <div className="mt-2">
                          <label className="block text-xs text-white/60 mb-1">
                            Bedömning (1-10): {selectedSteps[step.id]?.valuation || 5}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={selectedSteps[step.id]?.valuation || 5}
                            onChange={(e) => handleStepFeedback(
                              step.id.toString(),
                              selectedSteps[step.id]?.feedback || '',
                              parseInt(e.target.value)
                            )}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-white/60 mt-1">
                            <span>Behöver uppmärksamhet</span>
                            <span>Full förståelse</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Freetext Feedback Section */}
            <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <h3 className="font-bold text-lg text-white drop-shadow-sm mb-3 flex items-center gap-2">
                <FaFileAlt className="text-white/60" />
                Fritext Feedback
              </h3>
              
              <div className="space-y-3">
                <textarea
                  placeholder="Lägg till allmän feedback eller kommentarer..."
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded text-sm resize-none"
                  rows={3}
                  value={freetextFeedback.feedbackText}
                  onChange={(e) => setFreetextFeedback(prev => ({ ...prev, feedbackText: e.target.value }))}
                />
                
                <div className="mt-2">
                  <label className="block text-xs text-white/60 mb-1">
                    Allmän bedömning (1-10): {freetextFeedback.valuation}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={freetextFeedback.valuation}
                    onChange={(e) => setFreetextFeedback(prev => ({ ...prev, valuation: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Behöver uppmärksamhet</span>
                    <span>Utmärkt</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200"
              >
                Avbryt
              </button>
              <button
                onClick={saveFeedback}
                className="px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 rounded-lg hover:border-emerald-400/50 transition-all duration-200"
              >
                <FaSave className="inline mr-2" />
                Spara Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* Mobile Menu */}
      {renderMobileMenu()}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
              >
                <FaBars />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">Lärare Dashboard</h1>
                <p className="text-white/80">Välkommen, {user.firstName} {user.lastName}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => setActiveView('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeView === 'overview' 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FaClipboardList />
                Översikt
              </button>
              
              <button
                onClick={() => setActiveView('bookings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeView === 'bookings' 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FaCalendarAlt />
                Bokningar
              </button>
              
              <button
                onClick={() => setActiveView('feedback')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeView === 'feedback' 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FaCommentDots />
                Feedback
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeView === 'overview' && (
          <div className="space-y-8">
            {renderStatsCards()}
            {renderTodaysBookings()}
          </div>
        )}

        {activeView === 'bookings' && (
          <div className="space-y-8">
            {renderAllBookings()}
          </div>
        )}

        {activeView === 'feedback' && (
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white drop-shadow-sm mb-4">Feedback Översikt</h2>
              <p className="text-white/80 mb-6">
                Klicka på "Utbildningskort" för en lektion för att ge detaljerad feedback baserat på svenska trafikutbildningens krav.
              </p>
              
              {/* Today's Lessons Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white drop-shadow-sm mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-white/60" />
                  Dagens Lektioner
                </h3>
                {todaysBookings.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <FaCalendarAlt className="text-4xl mx-auto mb-3 opacity-50" />
                    <p>Inga lektioner idag</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysBookings.map((booking) => (
                      <div key={booking.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                              <h4 className="font-semibold text-white drop-shadow-sm">
                                {booking.studentName || booking.userName}
                              </h4>
                              <span className="text-xl">{getTransmissionIcon(booking.transmissionType)}</span>
                            </div>
                            <div className="text-sm text-white/80 space-y-1">
                              <div className="flex items-center gap-2">
                                <FaClock className="text-white/60" />
                                <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaCar className="text-white/60" />
                                <span>{booking.lessonTypeName}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleBookingSelect(booking)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm flex items-center gap-2"
                          >
                            <FaEdit />
                            Utbildningskort
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Day Selector for Past/Future Bookings */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white drop-shadow-sm mb-4 flex items-center gap-2">
                  <FaCalendar className="text-white/60" />
                  Lektioner per Dag
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <label className="text-white/80 text-sm font-medium mb-2 block">Välj datum:</label>
                    <input 
                      type="date" 
                      value={feedbackDate}
                      onChange={(e) => setFeedbackDate(e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedbackDate(new Date().toISOString().split('T')[0])}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm"
                    >
                      Idag
                    </button>
                    <button
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setFeedbackDate(yesterday.toISOString().split('T')[0]);
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm"
                    >
                      Igår
                    </button>
                    <button
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setFeedbackDate(tomorrow.toISOString().split('T')[0]);
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg hover:border-white/50 transition-all duration-200 text-sm"
                    >
                      Imorgon
                    </button>
                  </div>
                </div>
              </div>

              {/* Bookings for Selected Date */}
              <FeedbackBookingsList 
                date={feedbackDate}
                onBookingSelect={handleBookingSelect}
                getStatusColor={getStatusColor}
                getTransmissionIcon={getTransmissionIcon}
                formatTime={formatTime}
              />
            </div>
          </div>
        )}
      </div>

      {/* Booking Steps Modal */}
      {selectedBooking && renderBookingSteps()}

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboardClient;
