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
  FaExclamationTriangle
} from 'react-icons/fa';
import Link from 'next/link';
import { generateWeeklySchedulePdf, fetchWeeklyBookings } from '@/utils/pdfExport';
import { ExportButton } from '@/components/ui/ExportButton';

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
}

interface BookingStep {
  id: number;
  stepNumber: number;
  category: string;
  subcategory: string;
  description: string;
}

interface User {
  id: string;
  userId?: string; // Added optional userId for compatibility
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TeacherDashboardClientProps {
  user: User;
}

const TeacherDashboardClient: React.FC<TeacherDashboardClientProps> = ({ user }) => {
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [bookingSteps, setBookingSteps] = useState<BookingStep[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<{ [key: string]: { feedback: string; valuation: number } }>({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'bookings' | 'feedback'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateBookings, setDateBookings] = useState<Booking[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchTodaysBookings();
    fetchUpcomingBookings();
    fetchBookingSteps();
    fetchUnassignedBookings(); // Fetch all unassigned bookings for potential assignment
  }, []);

  useEffect(() => {
    fetchBookingsForDate(selectedDate);
  }, [selectedDate]);

  const fetchTodaysBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/teacher/bookings?date=${today}&teacherId=${user.userId || user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setTodaysBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch today\'s bookings:', error);
      setTodaysBookings([]); // Set empty array on error
    }
  };

  const fetchUpcomingBookings = async () => {
    try {
      const response = await fetch(`/api/teacher/bookings?teacherId=${user.userId || user.id}&upcoming=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setUpcomingBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch upcoming bookings:', error);
      setUpcomingBookings([]); // Set empty array on error
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

  const fetchUnassignedBookings = async () => {
    try {
      const response = await fetch(`/api/teacher/bookings?unassigned=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setUpcomingBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch unassigned bookings:', error);
      setUpcomingBookings([]);
    }
  };

  const fetchBookingsForDate = async (date: string) => {
    try {
      // If no specific date, fetch ALL bookings, otherwise fetch for specific date
      const url = date ? `/api/teacher/bookings?date=${date}&teacherId=${user.userId || user.id}` : `/api/teacher/bookings?teacherId=${user.userId || user.id}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setDateBookings(data.bookings || []);
    } catch (error) {
      console.error(`Failed to fetch bookings for ${date}:`, error);
      setDateBookings([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
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
      for (const [stepId, data] of Object.entries(selectedSteps)) {
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
      alert('Feedback sparad!');
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
      fetchUpcomingBookings();
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

  const assignBookingToSelf = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/teacher/assign-self/${bookingId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to assign booking');
      }
      fetchTodaysBookings();
      fetchUpcomingBookings();
      alert('Booking assigned to you');
    } catch (error) {
      console.error('Failed to assign booking:', error);
      alert('Assignment failed');
    }
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

  const renderMobileMenu = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden`}>
      <div className="bg-white w-64 h-full p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Meny</h2>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <FaTimes />
          </button>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => { setActiveView('overview'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
              activeView === 'overview' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaClipboardList />
            Översikt
          </button>
          
          <button
            onClick={() => { setActiveView('bookings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
              activeView === 'bookings' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaCalendarAlt />
            Bokningar
          </button>
          
          <button
            onClick={() => { setActiveView('feedback'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
              activeView === 'feedback' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaCommentDots />
            Feedback
          </button>
        </nav>
      </div>
    </div>
  );

  const renderTodaysBookings = () => (
    <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <FaCalendarAlt className="text-rose-300" />
        Dagens lektioner
      </h2>
      
      {todaysBookings.length === 0 ? (
        <div className="text-center py-8 text-slate-300">
          <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Inga lektioner idag</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaysBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                    <h3 className="font-semibold text-white">{booking.userName}</h3>
                    <span className="text-2xl">{getTransmissionIcon(booking.transmissionType)}</span>
                  </div>
                  
                  <div className="text-sm text-slate-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-slate-400" />
                      <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCar className="text-slate-400" />
                      <span>{booking.lessonTypeName}</span>
                    </div>

                    {booking.userPhone && (
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-slate-400" />
                        <span>{booking.userPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors text-sm shadow-inner"
                  >
                    <FaEdit className="inline mr-1" />
                    Utbildningskort
                  </button>
                  
                  <button
                    onClick={() => unbookLesson(booking.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors text-sm shadow-lg"
                  >
                    <FaTrash className="inline mr-1" />
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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Utbildningskort B - {selectedBooking.userName}
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(groupedSteps).map(([category, steps]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-3">
                    {steps[0]?.stepNumber}. {category}
                  </h3>
                  
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.id} className="bg-white rounded-lg p-3">
                        <h4 className="font-medium text-gray-700 mb-2">
                          {step.subcategory}
                        </h4>
                        
                        <textarea
                          placeholder="Lägg till feedback..."
                          className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                          rows={2}
                          value={selectedSteps[step.id]?.feedback || ''}
                          onChange={(e) => handleStepFeedback(
                            step.id.toString(), 
                            e.target.value, 
                            selectedSteps[step.id]?.valuation || 5
                          )}
                        />
                        
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">
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
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
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
            
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Avbryt
              </button>
              <button
                onClick={saveFeedback}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
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

  const renderBookingsForDate = () => (
    <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <FaCalendarAlt className="text-sky-300" />
        {selectedDate ? `Lektioner för ${formatDate(selectedDate)}` : 'Alla bokningar'}
      </h2>
      
      {dateBookings.length === 0 ? (
        <div className="text-center py-8 text-slate-300">
          <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Inga lektioner för detta datum</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dateBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                    <h3 className="font-semibold text-white">{booking.userName}</h3>
                    <span className="text-2xl">{getTransmissionIcon(booking.transmissionType)}</span>
                  </div>
                  
                  <div className="text-sm text-slate-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-slate-400" />
                      <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCar className="text-slate-400" />
                      <span>{booking.lessonTypeName}</span>
                    </div>

                    {booking.userPhone && (
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-slate-400" />
                        <span>{booking.userPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors text-sm shadow-inner"
                  >
                    <FaEdit className="inline mr-1" />
                    Utbildningskort
                  </button>
                  
                  <button
                    onClick={() => unbookLesson(booking.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors text-sm shadow-lg"
                  >
                    <FaTrash className="inline mr-1" />
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

  const renderUpcomingBookings = () => (
    <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <FaClock className="text-sky-300" />
        Kommande lektioner
      </h2>
      
      {upcomingBookings.length === 0 ? (
        <div className="text-center py-8 text-slate-300">
          <FaClock className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Inga kommande lektioner</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingBookings.slice(0, 5).map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></div>
                <div>
                  <p className="font-medium text-white">{booking.userName}</p>
                  <p className="text-sm text-slate-300">
                    {formatDate(booking.scheduledDate)} • {formatTime(booking.startTime)}
                  </p>
                </div>
              </div>
              <span className="text-2xl">{getTransmissionIcon(booking.transmissionType)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleExportSchedule = async () => {
    try {
      setIsExporting(true);
      const bookings = await fetchWeeklyBookings(user.userId || user.id, 'teacher');
      generateWeeklySchedulePdf(bookings, 'Mitt schema');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Kunde inte exportera schemat. Försök igen senare.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Mobile Menu */}
      {renderMobileMenu()}

      {/* Header */}
      <div className="backdrop-blur-md bg-white/10 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-200 hover:text-white rounded-xl border border-white/10 shadow-inner"
              >
                <FaBars />
              </button>
              
              <div>
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-white drop-shadow-sm">Lärarpanel</h1>
                  <ExportButton 
                    onClick={handleExportSchedule} 
                    loading={isExporting}
                    className="ml-4 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  />
                </div>
                <p className="text-slate-300">Välkommen, {user.firstName} {user.lastName}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => setActiveView('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border ${
                  activeView === 'overview' 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'text-slate-200 hover:bg-white/10 border-white/10'
                }`}
              >
                <FaClipboardList />
                Översikt
              </button>
              
              <button
                onClick={() => setActiveView('bookings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border ${
                  activeView === 'bookings' 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'text-slate-200 hover:bg-white/10 border-white/10'
                }`}
              >
                <FaCalendarAlt />
                Bokningar
              </button>
              
              <button
                onClick={() => setActiveView('feedback')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border ${
                  activeView === 'feedback' 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'text-slate-200 hover:bg-white/10 border-white/10'
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300">Dagens lektioner</p>
                    <p className="text-3xl font-bold text-white">{todaysBookings.length}</p>
                  </div>
                  <FaCalendarAlt className="text-4xl text-sky-300" />
                </div>
              </div>
              
              <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300">Kommande</p>
                    <p className="text-3xl font-bold text-white">{upcomingBookings.length}</p>
                  </div>
                  <FaClock className="text-4xl text-sky-300" />
                </div>
              </div>
              
              <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300">Genomförda idag</p>
                    <p className="text-3xl font-bold text-white">
                      {todaysBookings.filter(b => b.isCompleted).length}
                    </p>
                  </div>
                  <FaUsers className="text-4xl text-sky-300" />
                </div>
              </div>
            </div>

            {/* Today's Bookings */}
            {renderTodaysBookings()}

            {/* Upcoming Bookings */}
            {renderUpcomingBookings()}
          </div>
        )}

        {activeView === 'bookings' && (
          <div className="space-y-8">
            <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">Filtrera bokningar</h2>
              <div className="flex items-center gap-4">
                <label className="text-slate-300">Välj datum:</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-300"
                />
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors text-sm shadow-inner"
                >
                  Visa alla
                </button>
              </div>
            </div>
            {renderBookingsForDate()}
          </div>
        )}

        {activeView === 'feedback' && (
          <div className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Planering & feedback</h2>
            <p className="text-slate-300 mb-4">
              Klicka på "Utbildningskort" för en lektion för att ge detaljerad feedback baserat på svenska trafikutbildningens krav.
            </p>
            {renderTodaysBookings()}
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
