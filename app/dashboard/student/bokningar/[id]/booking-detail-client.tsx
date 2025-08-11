"use client";

import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaCoins, 
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCar,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowLeft,
  FaQrcode,
  FaMoneyBillWave,
  FaTrashAlt,
  FaTimesCircle
} from 'react-icons/fa';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

interface BookingDetailClientProps {
  booking: any;
  user: any;
}

interface PlannedStep {
  id: string;
  stepIdentifier: string;
  feedbackText?: string;
  valuation?: number;
  isFromTeacher: boolean;
}

const BookingDetailClient: React.FC<BookingDetailClientProps> = ({ booking, user }) => {
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [plannedSteps, setPlannedSteps] = useState<PlannedStep[]>([]);
  const [isLoadingPlannedSteps, setIsLoadingPlannedSteps] = useState(false);
  const [userCredits, setUserCredits] = useState<any[]>([]);
  const [isProcessingCredit, setIsProcessingCredit] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancellationError, setCancellationError] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'on_hold': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'unpaid': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handlePaymentConfirmation = async () => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}/payment-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userId: user.userId || user.id,
        }),
      });

      if (response.ok) {
        setIsPaymentConfirmed(true);
        // Optionally show a success message
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handleCreditPayment = async () => {
    if (isProcessingCredit) return;
    
    setIsProcessingCredit(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/pay-with-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userId: user.userId || user.id,
          lessonTypeId: booking.lessonTypeId,
        }),
      });

      if (response.ok) {
        toast.success('Betalning med krediter lyckades!');
        // Reload the page to show updated payment status
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte behandla kreditbetalning');
      }
    } catch (error) {
      console.error('Error processing credit payment:', error);
      toast.error('Ett fel inträffade vid betalning med krediter');
    } finally {
      setIsProcessingCredit(false);
    }
  };
  
  const handleCancellationRequest = () => {
    setShowCancelConfirmation(true);
    setCancellationError('');
    setCancellationReason('');
  };
  
  const handleCancelBooking = async () => {
    if (isCancelling) return;
    
    // Validate that reason is provided
    if (!cancellationReason.trim()) {
      setCancellationError('Vänligen ange en anledning för avbokning');
      return;
    }
    
    setIsCancelling(true);
    setCancellationError('');
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancellationReason
        })
      });

      if (response.ok) {
        toast.success('Bokningen har avbokats.');
        // Redirect back to dashboard after successful cancellation
        setTimeout(() => window.location.href = '/dashboard/student', 1500);
      } else {
        const data = await response.json();
        const errorMessage = data.error || 'Kunde inte avboka bokningen';
        if (data.hoursRemaining) {
          setCancellationError(`${errorMessage}. Du måste avboka minst ${Math.ceil(data.hoursRemaining)} timmar i förväg.`);
        } else {
          setCancellationError(errorMessage);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setCancellationError('Ett tekniskt fel inträffade. Vänligen försök igen senare.');
      toast.error('Ett tekniskt fel inträffade vid avbokning');
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleCancelConfirmation = () => {
    setShowCancelConfirmation(false);
  };

  const generateSwishURL = () => {
    const amount = booking.totalPrice;
    const message = `Körleksion ${booking.lessonTypeName} - ${formatDate(booking.scheduledDate)}`;
    return `swish://payment?phone=123456789&amount=${amount}&message=${encodeURIComponent(message)}`;
  };

  const loadPlannedSteps = async () => {
    setIsLoadingPlannedSteps(true);
    try {
      const response = await fetch(`/api/student/bookings/${booking.id}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setPlannedSteps(data);
      }
    } catch (error) {
      console.error('Error loading planned steps:', error);
    }
    setIsLoadingPlannedSteps(false);
  };

  const loadUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || []);
      }
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  useEffect(() => {
    if (booking.id) {
      loadPlannedSteps();
    }
    if (user.id && booking.paymentStatus === 'unpaid') {
      loadUserCredits();
    }
  }, [booking.id, user.id, booking.paymentStatus]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Cancellation Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancelConfirmation} />
          <div className="relative z-[11010] rounded-2xl bg-slate-900/95 border border-white/10 text-white shadow-2xl p-6 w-[min(92vw,560px)]">
            <h3 className="text-xl font-extrabold mb-2">Bekräfta avbokning</h3>
            <p className="text-slate-300 mb-4">Är du säker på att du vill avboka denna bokning? Detta går inte att ångra.</p>

            {cancellationError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">
                {cancellationError}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="cancellationReason" className="block text-sm font-medium text-white mb-2">Anledning för avbokning *</label>
              <textarea
                id="cancellationReason"
                className="w-full rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Vänligen ange anledningen till att du avbokar lektionen"
                disabled={isCancelling}
                required
              />
              <p className="mt-1 text-sm text-white/60">Det är viktigt att du anger en anledning för avbokningen.</p>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={handleCancelConfirmation}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50"
                disabled={isCancelling}
              >
                Behåll
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Avbokar...
                  </>
                ) : (
                  <>
                    <FaTrashAlt />
                    Ja, avboka bokningen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/dashboard/student" 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FaArrowLeft />
          Tillbaka till Studentsidan
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Main Booking Card */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">Bokning</h1>
              <p className="text-slate-300">Bokning ID: {booking.id}</p>
            </div>
            <div className="text-right">
              <div className="flex gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/10 border border-white/20`}>
                  {booking.status === 'confirmed' ? 'Bekräftad' : 
                   booking.status === 'pending' ? 'Väntande' : 
                   booking.status === 'on_hold' ? 'Pausad' : 
                   booking.status === 'cancelled' ? 'Avbokad' : booking.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/10 border border-white/20`}>
                  {booking.paymentStatus === 'paid' ? 'Betald' : 
                   booking.paymentStatus === 'unpaid' ? 'Ej betald' : booking.paymentStatus}
                </span>
              </div>
              
              {/* Cancellation Button - only show if booking is not already cancelled */}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <button
                  onClick={handleCancellationRequest}
                  className="mt-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <FaTimesCircle />
                  Avboka
                </button>
              )}
            </div>
          </div>

          {/* Booking Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lesson Information */}
            <div className="space-y-6">
              <div className="border-l-4 border-sky-400 pl-4">
                <h2 className="text-xl font-extrabold mb-4">Lektionsinformation</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="text-sky-300" />
                    <div>
                      <p className="font-semibold">{booking.lessonTypeName}</p>
                      <p className="text-sm text-slate-300">{booking.lessonTypeDescription}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FaClock className="text-emerald-300" />
                    <div>
                      <p className="font-semibold">{formatDate(booking.scheduledDate)}</p>
                      <p className="text-sm text-slate-300">{booking.startTime} - {booking.endTime} ({booking.durationMinutes} min)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FaCar className="text-purple-300" />
                    <div>
                      <p className="font-semibold">Växellåda: {booking.transmissionType || 'Ej specificerad'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FaCoins className="text-yellow-300" />
                    <div>
                      <p className="font-semibold text-lg">{Number(booking.totalPrice).toLocaleString('sv-SE')} SEK</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher Information */}
              {booking.teacherFirstName && (
                <div className="border-l-4 border-emerald-400 pl-4">
                  <h2 className="text-xl font-extrabold mb-4">Körlärarinformation</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FaUser className="text-emerald-300" />
                      <p className="font-semibold">{booking.teacherFirstName} {booking.teacherLastName}</p>
                    </div>

                    {booking.teacherEmail && (
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-sky-300" />
                        <p className="text-sm text-slate-200">{booking.teacherEmail}</p>
                      </div>
                    )}

                    {booking.teacherPhone && (
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-purple-300" />
                        <p className="text-sm text-slate-200">{booking.teacherPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div>
{booking.paymentStatus === 'unpaid' && (
                <div className="border-l-4 border-red-500 pl-4 mb-6">
                  <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-white">
                    <FaExclamationCircle className="text-red-400" />
                    Betalning krävs
                  </h2>

                  {/* Offer Credit Payment Option First */}
                  {userCredits.find(c => c.lessonTypeId === booking.lessonTypeId && c.creditsRemaining > 0) && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <FaCoins className="text-yellow-600" />
                          Du har krediter tillgängliga!
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Du har {userCredits.find(c => c.lessonTypeId === booking.lessonTypeId)?.creditsRemaining || 0} krediter kvar för {booking.lessonTypeName}.
                      </p>
                      <button
                        onClick={handleCreditPayment}
                        disabled={isProcessingCredit}
                        className="w-full bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCoins />
                        {isProcessingCredit ? 'Bearbetar...' : 'Betala med 1 kredit'}
                      </button>
                    </div>
                  )}

                  {/* Swish Payment Information */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 mb-4">
                    <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                      <FaQrcode className="text-sky-300" />
                      Betala med Swish
                    </h3>

                    <div className="text-center mb-4">
                      <QRCodeSVG 
                        value={generateSwishURL()}
                        size={150}
                        className="mx-auto bg-white p-2 rounded-lg"
                      />
                      <p className="text-sm text-slate-300 mt-2">Skanna QR-koden med din Swish-app</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Betalningsinformation:</h4>
                      <div className="space-y-1 text-sm text-slate-200">
                        <p><strong>Mottagare:</strong> Din Trafikskola HLM</p>
                        <p><strong>Belopp:</strong> {Number(booking.totalPrice).toLocaleString('sv-SE')} SEK</p>
                        <p><strong>Meddelande:</strong> Körleksion {booking.lessonTypeName} - {formatDate(booking.scheduledDate)}</p>
                      </div>
                    </div>

                    {/* Payment Confirmation Button */}
                    {!isPaymentConfirmed ? (
                <button
                        onClick={handlePaymentConfirmation}
                  className="w-full mt-4 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                  disabled={isPaymentConfirmed}
                      >
                  {isPaymentConfirmed ? (
                    <>
                      <FaCheckCircle />
                      Bekräftad
                    </>
                  ) : (
                    <>
                      <FaMoneyBillWave />
                      Jag har betalat
                    </>
                  )}
                      </button>
                    ) : (
                      <div className="w-full mt-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-semibold">
                        <FaCheckCircle />
                        Betalningsbekräftelse skickad
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2 text-center">
                      När du klickar på "Jag har betalat" skickas ett meddelande till våra administratörer för verifiering.
                    </p>
                  </div>
                </div>
              )}

              {booking.paymentStatus === 'paid' && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    Betalning genomförd
                  </h2>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800">Din betalning har bekräftats och är mottagen.</p>
                    {booking.paymentMethod && (
                      <p className="text-sm text-green-700 mt-1">Betalningsmetod: {booking.paymentMethod}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {booking.notes && (
                <div className="border-l-4 border-gray-500 pl-4 mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Anteckningar</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{booking.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Planned Steps and Feedback */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl p-8">
          <h2 className="text-2xl font-extrabold mb-4">Planerade steg & feedback</h2>
          {isLoadingPlannedSteps ? (
            <p className="text-slate-300">Laddar planerade steg...</p>
          ) : plannedSteps.length > 0 ? (
            <div className="space-y-4">
              {plannedSteps.map(step => (
                <div key={step.id} className="p-4 border border-white/10 rounded-lg bg-white/5">
                  <h3 className="font-extrabold text-lg">{step.stepIdentifier}</h3>
                  {step.feedbackText && (
                    <p className="text-slate-200 mt-2">{step.feedbackText}</p>
                  )}
                  {step.valuation !== null && step.valuation !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-semibold">Värdering:</span>
                      <span className="text-sky-300 font-bold">{step.valuation}/10</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-300">Inga planerade steg eller feedback för denna lektion ännu.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-6">
          <Link href="/dashboard/student" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white">
            Tillbaka till Studentsidan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailClient;
