"use client";

import React from 'react';
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaClock, 
  FaCreditCard, 
  FaShoppingCart, 
  FaCommentDots,
  FaTrophy,
  FaCoins,
  FaStar,
  FaBookOpen,
  FaGraduationCap,
  FaStore,
  FaEnvelope
} from 'react-icons/fa';
import Link from 'next/link';
import MessageIndicator from '@/components/message-indicator';

const StudentDashboardClient = ({ user, bookings, credits, feedback, stats }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'on_hold': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'unpaid': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'} />
    ));
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-6 rounded-xl shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <FaGraduationCap className="text-yellow-300" />
              Studentsidan
            </h1>
            <p className="text-xl mt-2 text-blue-100">Välkommen tillbaka, {user.firstName} {user.lastName}!</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">Din framsteg</div>
            <div className="text-2xl font-bold">{stats.completedBookings}/{stats.totalBookings}</div>
          </div>
        </div>

        {/* Horizontal Navigation Menu */}
        <div className="mt-4">
          <nav className="flex justify-center gap-4 text-lg font-semibold">
            <Link href="/dashboard/student" className="hover:text-yellow-300">Bokningar</Link>
            <Link href="/dashboard/student/feedback" className="hover:text-yellow-300">Feedback</Link>
            <MessageIndicator href="/dashboard/student/meddelande" className="hover:text-yellow-300">
              Meddelande
            </MessageIndicator>
            <Link href="/dashboard/student/settings" className="hover:text-yellow-300">Inställningar</Link>
              <Link href="/dashboard/utbildningskort" className="hover:text-yellow-300">Utbildningskort</Link>
            </nav>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totala Lektioner</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
            </div>
            <FaBookOpen className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Genomförda</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
            </div>
            <FaCheckCircle className="text-4xl text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kommande</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.upcomingBookings}</p>
            </div>
            <FaClock className="text-4xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tillgängliga Credits</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalCredits}</p>
            </div>
            <FaCoins className="text-4xl text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                Mina Bokningar
              </h2>
              <Link 
                href="/boka-korning" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Boka Ny Lektion
              </Link>
            </div>
            
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{booking.lessonTypeName}</h3>
                      <p className="text-sm text-gray-600">{formatDate(booking.scheduledDate)}</p>
                      <p className="text-sm text-gray-600">{booking.startTime} - {booking.endTime}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCoins className="text-sm text-gray-500" />
                        <span className="font-semibold">{Number(booking.totalPrice).toLocaleString('sv-SE')} SEK</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status === 'confirmed' ? 'Bekräftad' : 
                         booking.status === 'pending' ? 'Väntande' : 
                         booking.status === 'on_hold' ? 'Pausad' : 
                         booking.status === 'cancelled' ? 'Avbokad' : booking.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus === 'paid' ? 'Betald' : 
                         booking.paymentStatus === 'unpaid' ? 'Ej betald' : booking.paymentStatus}
                      </span>
                    </div>
                    <Link 
                      href={`/dashboard/student/bokningar/${booking.id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                    >
                      Visa bokning
                    </Link>
                  </div>
                </div>
              ))}
              
              {bookings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50" />
                  <p>Inga bokningar än. Boka din första lektion!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Credits */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FaCoins className="text-yellow-500" />
              Dina Credits
            </h3>
            
            {credits.length > 0 ? (
              <div className="space-y-3">
                {credits.map((credit) => (
                  <div key={credit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{credit.lessonTypeName}</span>
                    <span className="font-bold text-purple-600">{credit.creditsRemaining}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Inga credits ännu</p>
            )}
          </div>

          {/* Recent Feedback */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FaCommentDots className="text-blue-500" />
              Senaste Feedback
            </h3>
            
            {feedback.length > 0 ? (
              <div className="space-y-3">
                {feedback.slice(0, 3).map((fb) => (
                  <Link 
                    key={fb.id} 
                    href={`/dashboard/student/bokningar/${fb.bookingId}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1 mb-2">
                      {renderStars(fb.rating)}
                    </div>
                    <p className="text-sm text-gray-700">{fb.feedbackText}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {fb.isFromTeacher ? 'Från lärare' : 'Från dig'} • {fb.createdAt ? formatDate(fb.createdAt) : 'Okänt datum'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Klicka för att se hela bokningen →</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Ingen feedback ännu</p>
            )}
          </div>

          {/* Packages CTA */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <FaTrophy className="text-4xl mx-auto mb-4 text-yellow-300" />
              <h3 className="text-xl font-bold mb-2">Köp Paket & Spara!</h3>
              <p className="text-sm opacity-90 mb-4">
                Upptäck våra fantastiska paket och få mer för pengarna
              </p>
              <Link 
                href="/packages-store" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaShoppingCart />
                Se Alla Paket
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardClient;

