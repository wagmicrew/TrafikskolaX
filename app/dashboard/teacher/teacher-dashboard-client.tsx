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

  useEffect(() => {
    fetchTodaysBookings();
    fetchUpcomingBookings();
    fetchBookingSteps();
  }, []);

  useEffect(() => {
    fetchBookingsForDate(selectedDate);
  }, [selectedDate]);

  const fetchTodaysBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/teacher/bookings?date=${today}&teacherId=${user.id}`);
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
      const response = await fetch(`/api/teacher/bookings?teacherId=${user.id}&upcoming=true`);
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

  const fetchBookingsForDate = async (date: string) => {
    try {
      const response = await fetch(`/api/teacher/bookings?date=${date}&teacherId=${user.id}`);
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
              activeView === 'overview' ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaClipboardList />
            Översikt
          </button>
          
          <button
            onClick={() => { setActiveView('bookings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
              activeView === 'bookings' ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaCalendarAlt />
            Bokningar
          </button>
          
          <button
            onClick={() => { setActiveView('feedback'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
              activeView === 'feedback' ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaCommentDots />
            Feedback
          </button>

          <Link 
            href="/dashboard/teacher/meddelande"
            className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <FaEnvelope />
            Meddelanden
          </Link>
        </nav>
      </div>
    </div>
  );

  const renderTodaysBookings = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaCalendarAlt className="text-red-500" />
        Dagens Lektioner
      </h2>
      
      {todaysBookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Inga lektioner idag</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaysBookings.map((booking) => (
            <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                    <h3 className="font-semibold text-gray-800">{booking.userName}</h3>
                    <span className="text-2xl">{getTransmissionIcon(booking.transmissionType)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCar className="text-gray-400" />
                      <span>{booking.lessonTypeName}</span>
                    </div>

                    {booking.userPhone && (
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-gray-400" />
                        <span>{booking.userPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <FaEdit className="inline mr-1" />
                    Utbildningskort
                  </button>
                  
                  <button
                    onClick={() => unbookLesson(booking.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaCalendarAlt className="text-red-500" />
        Lektioner för {formatDate(selectedDate)}
      </h2>
      
      {dateBookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Inga lektioner för detta datum</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dateBookings.map((booking) => (
            <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></span>
                    <h3 className="font-semibold text-gray-800">{booking.userName}</h3>
                    <span className="text-2xl">{getTransmissionIcon(booking.transmissionType)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FaCar className="text-gray-400" />
                      <span>{booking.lessonTypeName}</span>
                    </div>

                    {booking.userPhone && (
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-gray-400" />
                        <span>{booking.userPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <FaEdit className="inline mr-1" />
                    Utbildningskort
                  </button>
                  
                  <button
                    onClick={() => unbookLesson(booking.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaClock className="text-blue-500" />
        Kommande Lektioner
      </h2>
      
      {upcomingBookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaClock className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Inga kommande lektioner</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingBookings.slice(0, 5).map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></div>
                <div>
                  <p className="font-medium text-gray-800">{booking.userName}</p>
                  <p className="text-sm text-gray-600">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black">
      {/* Mobile Menu */}
      {renderMobileMenu()}

      {/* Header */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-red-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-white hover:text-red-400"
              >
                <FaBars />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-white">Lärare Dashboard</h1>
                <p className="text-red-200">Välkommen, {user.firstName} {user.lastName}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => setActiveView('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'overview' 
                    ? 'bg-red-500 text-white' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaClipboardList />
                Översikt
              </button>
              
              <button
                onClick={() => setActiveView('bookings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'bookings' 
                    ? 'bg-red-500 text-white' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaCalendarAlt />
                Bokningar
              </button>
              
              <button
                onClick={() => setActiveView('feedback')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'feedback' 
                    ? 'bg-red-500 text-white' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaCommentDots />
                Feedback
              </button>

              <Link 
                href="/dashboard/teacher/meddelande"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <FaEnvelope />
                Meddelanden
              </Link>
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
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100">Dagens Lektioner</p>
                    <p className="text-3xl font-bold">{todaysBookings.length}</p>
                  </div>
                  <FaCalendarAlt className="text-4xl text-red-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Kommande</p>
                    <p className="text-3xl font-bold">{upcomingBookings.length}</p>
                  </div>
                  <FaClock className="text-4xl text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Genomförda Idag</p>
                    <p className="text-3xl font-bold">
                      {todaysBookings.filter(b => b.isCompleted).length}
                    </p>
                  </div>
                  <FaUsers className="text-4xl text-green-200" />
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Välj datum</h2>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 border rounded-lg"
              />
            </div>
            {renderBookingsForDate()}
          </div>
        )}

        {activeView === 'feedback' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Feedback Översikt</h2>
            <p className="text-gray-600 mb-4">
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
