"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Coins,
  User,
  Phone,
  Mail,
  Car,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  CreditCard,
  Trash2,
  X,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from 'flowbite-react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StudentHeader from '../../StudentHeader';
import { FaExclamationCircle, FaCoins, FaQrcode, FaCheckCircle, FaMoneyBillWave } from 'react-icons/fa';

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'failure';
      default: return 'gray';
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'success';
      case 'unpaid': return 'failure';
      default: return 'gray';
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <StudentHeader
        title="Bokningsdetaljer"
        icon={<Calendar className="w-5 h-5" />}
        userName={user.firstName}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cancellation Confirmation Modal */}
        <Modal
          show={showCancelConfirmation}
          onClose={handleCancelConfirmation}
          size="lg"
        >
          <ModalHeader>
            Bekräfta avbokning
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600 mb-4">
              Är du säker på att du vill avboka denna bokning? Detta går inte att ångra.
            </p>

            {cancellationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{cancellationError}</p>
              </div>
            )}

            <div className="mb-4">
              <Label htmlFor="cancellationReason" className="text-gray-900 font-medium mb-2 block">
                Anledning för avbokning *
              </Label>
              <Textarea
                id="cancellationReason"
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Vänligen ange anledningen till att du avbokar lektionen"
                disabled={isCancelling}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Det är viktigt att du anger en anledning för avbokningen.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={handleCancelConfirmation}
              disabled={isCancelling}
            >
              Behåll
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelBooking}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Avbokar...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ja, avboka bokningen
                </>
              )}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Main Booking Card */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl text-gray-900">Bokningsdetaljer</CardTitle>
                <p className="text-gray-600 mt-1">Bokning ID: {booking.id}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2">
                  <Badge color={getStatusColor(booking.status)} size="lg">
                    {booking.status === 'confirmed' ? 'Bekräftad' :
                     booking.status === 'pending' ? 'Väntande' :
                     booking.status === 'on_hold' ? 'Pausad' :
                     booking.status === 'cancelled' ? 'Avbokad' : 
                     booking.status === 'completed' ? 'Genomförd' : 'Okänd status'}
                  </Badge>
                  <Badge color={getPaymentStatusColor(booking.paymentStatus)} size="lg">
                    {booking.paymentStatus === 'paid' ? 'Betald' :
                     booking.paymentStatus === 'unpaid' ? 'Ej betald' :
                     booking.paymentStatus === 'pending' ? 'Väntande betalning' :
                     booking.paymentStatus === 'failed' ? 'Betalning misslyckades' : 'Okänd betalningsstatus'}
                  </Badge>
                </div>

                {/* Cancellation Button - only show if booking is not already cancelled */}
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <Button
                    onClick={handleCancellationRequest}
                    variant="danger"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Avboka
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>

            {/* Booking Details */}
            <div className="space-y-6">
              {/* Lesson Information */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Lektionsinformation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">{booking.lessonTypeName}</p>
                      <p className="text-sm text-gray-600">{booking.lessonTypeDescription}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">{formatDate(booking.scheduledDate)}</p>
                      <p className="text-sm text-gray-600">{booking.startTime} - {booking.endTime} ({booking.durationMinutes} min)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Car className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Växellåda: {booking.transmissionType || 'Ej specificerad'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Coins className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-lg text-gray-900">{Number(booking.totalPrice).toLocaleString('sv-SE')} SEK</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              {booking.paymentStatus === 'unpaid' && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Betalningsdetaljer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Coins className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Belopp att betala</p>
                        <p className="text-2xl font-bold text-blue-900">{Number(booking.totalPrice).toLocaleString('sv-SE')} SEK</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Swish-nummer</p>
                        <p className="text-lg font-mono text-gray-800">123 456 78 90</p>
                        <p className="text-sm text-gray-600">Meddelande: Bokning {booking.id.slice(0, 8)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <Button
                        onClick={() => window.open(`/betalhubben/${booking.id}`, '_blank')}
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Öppna i Betalhubben
                      </Button>
                      
                      <Button
                        onClick={() => toast('Qliro-betalning kommer snart')}
                        className="w-full bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Betala med Qliro
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

                  {/* Payment Hub Link */}
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <CreditCard className="text-blue-600" />
                        Betala din bokning
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Klicka här för att betala din bokning säkert via vår betalportal.
                    </p>
                    <Link
                      href={`/betalhubben/${booking.id}`}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <CreditCard />
                      Gå till betalning
                    </Link>
                  </div>

                  {/* Swish Payment Information */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 mb-4">
                    <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                      <FaQrcode className="text-sky-300" />
                      Eller betala med Swish
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
        </CardContent>
      </Card>

        {/* Planned Steps and Feedback */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Planerade steg & feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingPlannedSteps ? (
              <p className="text-indigo-600 font-medium">Laddar planerade steg...</p>
            ) : plannedSteps.length > 0 ? (
              <div className="space-y-4">
                {plannedSteps.map(step => (
                  <div key={step.id} className="p-5 border-2 border-indigo-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-xl text-indigo-900 mb-3">{step.stepIdentifier}</h3>
                    {step.feedbackText && (
                      <p className="text-gray-800 leading-relaxed font-medium mb-3">{step.feedbackText}</p>
                    )}
                    {step.valuation !== null && step.valuation !== undefined && (
                      <div className="flex items-center gap-2 p-3 bg-indigo-100 rounded-lg">
                        <span className="font-bold text-indigo-900">Värdering:</span>
                        <span className="text-indigo-700 font-black text-lg">{step.valuation}/10</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <p className="text-indigo-600 font-medium text-lg">Inga planerade steg eller feedback för denna lektion ännu.</p>
                <p className="text-indigo-500 text-sm mt-2">Feedback kommer att visas här efter lektionen.</p>
              </div>
            )}
          </CardContent>
        </Card>

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
