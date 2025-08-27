"use client";

import React, { useMemo, useState, useEffect } from 'react';
import SwishQR from '@/components/SwishQR';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Printer,
  CreditCard,
  CheckCircle2,
  MailCheck,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  User,
  MapPin,
  Phone,
  FileText,
  Receipt,
  Coins,
  Check,
  X,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQliroListener } from '@/hooks/use-qliro-listener';
import { useAuth } from '@/lib/hooks/useAuth';

type Booking = {
  id: string;
  userId?: string | null;
  lessonTypeId?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  transmissionType?: string | null;
  totalPrice: number;
  status: string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  swishUUID?: string | null;
  teacherId?: string | null;
  isGuestBooking: boolean;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type LessonType = {
  id: string;
  name: string;
  type: 'lesson' | 'handledar' | 'teori';
  description?: string | null;
  durationMinutes: number;
  price: number;
} | null;

type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: string;
} | null;

type Invoice = {
  id: string;
  invoiceNumber?: string | null;
  amount: number;
  status: string;
  dueDate?: Date | null;
  createdAt: Date;
} | null;

export default function BookingPaymentClient({
  booking,
  lessonType,
  user,
  invoice,
  settings,
  isPaid,
}: {
  booking: Booking;
  lessonType: LessonType;
  user: User;
  invoice: Invoice;
  settings: {
    schoolName: string;
    schoolPhone?: string;
    swishNumber?: string;
    schoolAddress?: string;
    mapsEmbedUrl?: string
  };
  isPaid: boolean;
}) {
  const { user: currentUser } = useAuth();
  const [isGeneratingQliro, setIsGeneratingQliro] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [hasClickedPaid, setHasClickedPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Qliro completion listener for regular bookings
  useQliroListener({
    onCompleted: () => {
      console.log('[BOOKING DEBUG] Qliro payment completed for booking:', booking.id);
      try {
        window.location.href = `/booking/success?bookingId=${booking.id}`;
      } catch (e) {
        console.error('[BOOKING DEBUG] Failed to redirect:', e);
        // Fallback: reload page to show updated payment status
        window.location.reload();
      }
    },
    onDeclined: (reason, message) => {
      console.log('[BOOKING DEBUG] Qliro payment declined:', { reason, message });
      toast.error(`Betalning nekades: ${[reason, message].filter(Boolean).join(' - ')}`);
    },
    onError: (error) => {
      console.error('[BOOKING DEBUG] Qliro payment error:', error);
      toast.error('Ett fel uppstod med betalningen');
    }
  });

  // Fetch user credits if logged in
  useEffect(() => {
    if (currentUser && booking.userId === currentUser.userId) {
      fetchUserCredits();
    }
  }, [currentUser, booking.userId]);

  // Check if user has already clicked "I have paid"
  useEffect(() => {
    if (booking.paymentStatus === 'pending_admin_confirmation') {
      setHasClickedPaid(true);
    }
  }, [booking.paymentStatus]);

  // Fetch user credits
  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        const totalCredits = data.credits?.reduce((sum: number, c: any) => sum + c.creditsRemaining, 0) || 0;
        setUserCredits(totalCredits);
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  // Pay with credits
  const payWithCredits = async () => {
    if (userCredits < amount) {
      toast.error('Du har inte tillräckligt med krediter för denna bokning');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/booking/pay-with-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: amount
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pay with credits');
      }

      toast.success('Betalning genomförd med krediter!');
      setTimeout(() => {
        window.location.href = `/booking/success?bookingId=${booking.id}`;
      }, 1000);
    } catch (error) {
      console.error('Error paying with credits:', error);
      toast.error('Ett fel uppstod vid betalning med krediter');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Mark as paid (user clicked "I have paid")
  const markAsPaid = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/booking/mark-as-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as paid');
      }

      setHasClickedPaid(true);
      toast.success('Bekräftelse skickad till administratör. Du kommer att få ett mail när betalningen är godkänd.');
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Ett fel uppstod när betalning skulle markeras');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Admin actions
  const confirmSwishPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/admin/booking/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm payment');
      }

      toast.success('Betalning bekräftad!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Ett fel uppstod vid bekräftelse');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const sendPaymentReminder = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/admin/booking/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reminder');
      }

      toast.success('Påminnelse skickad till kund!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Ett fel uppstod när påminnelse skulle skickas');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const declineOrder = async () => {
    if (!confirm('Är du säker på att du vill neka denna order? Detta kommer att släppa tiden och skicka ett mail till kunden.')) {
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/admin/booking/decline-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decline order');
      }

      toast.success('Order nekad och tid släppt');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error declining order:', error);
      toast.error('Ett fel uppstod när order skulle nekas');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const amount = useMemo(() => Number(booking.totalPrice || 0), [booking.totalPrice]);
  const sessionDate = useMemo(() => format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv }), [booking.scheduledDate]);

  // Get customer info
  const customerName = booking.isGuestBooking
    ? booking.guestName
    : (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Okänd kund');
  const customerEmail = booking.isGuestBooking ? booking.guestEmail : (user?.email || '');
  const customerPhone = booking.isGuestBooking ? booking.guestPhone : (user?.phone || '');

  const payWithQliro = async () => {
    try {
      setIsGeneratingQliro(true);

      console.log('[BOOKING DEBUG] Starting Qliro payment for booking:', booking.id);

      // Step 1 & 2: Create order via unified API (following Qliro docs)
      const res = await fetch('/api/payments/qliro/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Kunde inte skapa Qliro-checkout');
      }

      console.log('[BOOKING DEBUG] Order created successfully:', {
        checkoutId: data.checkoutId,
        merchantReference: data.merchantReference
      });

      // Step 3, 4, 5: Use flow manager to handle checkout display
      const { QliroFlowManager } = await import('@/lib/payment/qliro-flow-manager');
      await QliroFlowManager.openQliroCheckout({
        orderId: String(data.checkoutId),
        amount: amount,
        description: `${lessonType?.name || 'Körlektion'} ${format(new Date(booking.scheduledDate), 'yyyy-MM-dd')} ${booking.startTime.slice(0,5)}`,
        checkoutUrl: data.checkoutUrl,
        onCompleted: () => {
          console.log('[BOOKING DEBUG] Payment completed, redirecting...');
          window.location.href = `/booking/success?bookingId=${booking.id}`;
        },
        onError: (error) => {
          console.error('[BOOKING DEBUG] Payment error:', error);
          toast.error(`Betalningsfel: ${error.message || 'Ett fel uppstod'}`);
        }
      });

    } catch (err) {
      console.error('[BOOKING DEBUG] Qliro payment error:', err);
      toast.error((err as Error).message || 'Ett fel uppstod vid betalning');
    } finally {
      setIsGeneratingQliro(false);
    }
  };

  const notifyPaid = async () => {
    try {
      setIsNotifying(true);
      const res = await fetch('/api/booking/confirm-swish-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: 'swish'
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Kunde inte meddela skolan');
      }
      toast.success('Tack! Skolan har meddelats.');
      setNotified(true);
    } catch (e: any) {
      toast.error(e.message || 'Ett fel inträffade');
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:text-black { color: #000 !important; }
          .print\\:bg-white { background: #fff !important; }
          .print\\:border-black\\/20 { border-color: rgba(0,0,0,0.2) !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:leading-tight { line-height: 1.2 !important; }
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">{settings.schoolName}</h1>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Skriv ut
          </button>
        </div>

        <div className="space-y-6">
          {/* Booking Details Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:border-black/20 print:shadow-none">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 print:text-black">
                {lessonType?.name || 'Körlektion'}
              </h2>
              <div className="text-sm text-gray-500 print:text-black">
                Boknings-ID: {booking.id.slice(0, 8)}
              </div>
            </div>

            {/* Lesson Details */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900 print:text-black">{sessionDate}</div>
                  <div className="text-sm text-gray-600 print:text-black">Datum</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900 print:text-black">
                    {booking.startTime.slice(0,5)} - {booking.endTime.slice(0,5)}
                  </div>
                  <div className="text-sm text-gray-600 print:text-black">
                    {booking.durationMinutes} minuter
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900 print:text-black">{customerName}</div>
                  <div className="text-sm text-gray-600 print:text-black">
                    {booking.isGuestBooking ? 'Gäst' : 'Registrerad användare'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {booking.transmissionType === 'automatic' ? 'A' : 'M'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 print:text-black">
                    {booking.transmissionType === 'automatic' ? 'Automat' : 'Manuell'}
                  </div>
                  <div className="text-sm text-gray-600 print:text-black">Växellåda</div>
                </div>
              </div>
            </div>

            {/* Price and Status */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-2xl font-bold text-green-600">
                {amount} kr
              </div>
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Betald
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                    <Clock className="h-4 w-4" />
                    Väntar på betalning
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:border-black/20 print:shadow-none">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 print:text-black">
              <User className="h-5 w-5" />
              Kunduppgifter
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-gray-500 print:text-black">Namn</div>
                <div className="text-gray-900 print:text-black">{customerName || 'Ej angivet'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 print:text-black">E-post</div>
                <div className="text-gray-900 print:text-black">{customerEmail || 'Ej angivet'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 print:text-black">Telefon</div>
                <div className="text-gray-900 print:text-black">{customerPhone || 'Ej angivet'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 print:text-black">Typ</div>
                <div className="text-gray-900 print:text-black">
                  {booking.isGuestBooking ? 'Gästbokning' : 'Registrerad användare'}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details Card (if exists) */}
          {invoice && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:border-black/20 print:shadow-none">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 print:text-black">
                <Receipt className="h-5 w-5" />
                Fakturauppgifter
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-gray-500 print:text-black">Fakturanummer</div>
                  <div className="text-gray-900 print:text-black">{invoice.invoiceNumber || 'Ej tilldelat'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 print:text-black">Belopp</div>
                  <div className="text-gray-900 print:text-black">{invoice.amount} kr</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 print:text-black">Status</div>
                  <div className="text-gray-900 print:text-black">
                    {invoice.status === 'paid' ? 'Betald' : 'Obetald'}
                  </div>
                </div>
                {invoice.dueDate && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 print:text-black">Förfallodatum</div>
                    <div className="text-gray-900 print:text-black">
                      {format(new Date(invoice.dueDate), 'yyyy-MM-dd')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* School Information */}
          {settings.schoolAddress && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:border-black/20 print:shadow-none">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 print:text-black">
                <MapPin className="h-5 w-5" />
                Plats
              </h3>
              <div className="mb-4">
                <div className="text-gray-900 print:text-black">{settings.schoolAddress}</div>
              </div>
              {settings.mapsEmbedUrl && (
                <div className="overflow-hidden rounded-lg border border-gray-200 print:hidden">
                  <iframe
                    src={settings.mapsEmbedUrl}
                    className="h-48 w-full"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
          </div>
          )}

          {/* Payment Section */}
          {booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'confirmed' ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Swish Payment */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Swish Betalning</h3>
                </div>

                <div className="mb-4 text-sm text-blue-700">
                  Belopp: <span className="font-semibold">{amount} kr</span>
                </div>

                {settings.swishNumber ? (
                  <div className="mb-4 flex justify-center">
                    <SwishQR
                      phoneNumber={settings.swishNumber}
                      amount={amount.toString()}
                      message={`Bokning ${booking.id.slice(0, 8)} - ${lessonType?.name || 'Körlektion'}`}
                      size={200}
                    />
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-800">
                    Swish-nummer saknas i inställningar
                  </div>
                )}

                <div className="flex justify-center">
                  {hasClickedPaid ? (
                    <div className="rounded-lg bg-green-100 px-4 py-2 text-sm text-green-800">
                      Väntar på skolans bekräftelse
                    </div>
                  ) : (
                    <button
                      onClick={markAsPaid}
                      disabled={isProcessingPayment}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MailCheck className="h-4 w-4" />
                      )}
                      {isProcessingPayment ? 'Skickar...' : 'Jag har betalat'}
                    </button>
                  )}
                </div>
              </div>

              {/* Credits Payment - Only show if user is logged in and has credits */}
              {currentUser && booking.userId === currentUser.userId && userCredits > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Coins className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-900">Betala med krediter</h3>
              </div>

                  <div className="mb-4">
                    <p className="text-sm text-green-700 mb-2">
                      Du har <span className="font-semibold">{userCredits} krediter</span> tillgängliga.
                    </p>
                    {userCredits >= amount ? (
                      <p className="text-sm text-green-700">
                        Denna bokning kostar {amount} kr. Du kommer att ha {userCredits - amount} krediter kvar efter betalning.
                      </p>
                    ) : (
                      <p className="text-sm text-red-700">
                        Denna bokning kostar {amount} kr men du har endast {userCredits} krediter. Du behöver välja en annan betalningsmetod.
                      </p>
                    )}
            </div>

                  <button
                    onClick={payWithCredits}
                    disabled={isProcessingPayment || userCredits < amount}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Coins className="h-4 w-4" />
                    )}
                    {isProcessingPayment ? 'Behandlar...' : `Betala med krediter (${amount} kr)`}
                  </button>
                </div>
              )}

              {/* Qliro Payment */}
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900">Betala med kort</h3>
                </div>

                <p className="mb-4 text-sm text-purple-700">
                  Betala med faktura eller delbetalning via Qliro.
                </p>

                <button
                  onClick={payWithQliro}
                  disabled={isGeneratingQliro}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {isGeneratingQliro ? 'Öppnar Qliro...' : 'Öppna Qliro'}
                </button>
              </div>

              {/* Admin Controls - Show only for admins */}
              {currentUser && currentUser.role === 'admin' && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-orange-900">Administratörskontroller</h3>
                    <p className="text-sm text-orange-700">Hantera betalning och påminnelser</p>
                  </div>

                  {/* Flowbite Button Group */}
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      onClick={confirmSwishPayment}
                      disabled={isProcessingPayment || !hasClickedPaid}
                      className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg focus:z-10 focus:ring-2 focus:ring-green-700 focus:text-green-700 ${
                        hasClickedPaid
                          ? 'text-green-700 bg-white hover:bg-gray-100 hover:text-green-800'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      } dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600`}
                    >
                      <Check className="w-4 h-4 mr-1 inline" />
                      Bekräfta Swish
                    </button>
                    <button
                      onClick={sendPaymentReminder}
                      disabled={isProcessingPayment}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600"
                    >
                      <Bell className="w-4 h-4 mr-1 inline" />
                      Påminn kund
                    </button>
                    <button
                      onClick={declineOrder}
                      disabled={isProcessingPayment}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-red-800 focus:z-10 focus:ring-2 focus:ring-red-700 focus:text-red-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600"
                    >
                      <X className="w-4 h-4 mr-1 inline" />
                      Neka order
                    </button>
                  </div>

                  {hasClickedPaid && (
                    <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800">
                      ✓ Kunden har klickat "Jag har betalat" - kan bekräftas
                    </div>
                  )}
            </div>
          )}
            </div>
          ) : (
            /* Payment Confirmed */
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Betalning mottagen</h3>
                  <p className="text-sm text-green-700">Din bokning är bekräftad och betald.</p>
                </div>
        </div>
      </div>
          )}

          {/* Footer Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:border-black/20 print:shadow-none">
            <div className="flex flex-col gap-2 text-sm text-gray-600 print:text-black">
              {settings.schoolPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Frågor? Ring {settings.schoolPhone}</span>
                </div>
              )}
              {customerEmail && (
                <div className="flex items-center gap-2">
                  <MailCheck className="h-4 w-4" />
                  <span>Bekräftelse skickad till {customerEmail}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Boknings-ID: {booking.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


