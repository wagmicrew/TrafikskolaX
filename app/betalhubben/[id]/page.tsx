'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from 'flowbite-react';
import { useRouter as useNextRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coins,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  AlertTriangle,
  User,
  BookOpen,
  Package,
  FileText,
  RefreshCw,
  Copy,
  Eye,
  Timer,
  Gift,
  Sparkles
} from 'lucide-react';
import { SwishPaymentDialog } from '@/components/booking/swish-payment-dialog';
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog';
import Link from 'next/link';
import { TrueFocusText } from '@/components/ui/true-focus-text';
import { OrbSpinner } from '@/components/ui/orb-loader';

interface Invoice {
  id: string;
  invoice_number: string;
  type: 'booking' | 'handledar' | 'package' | 'custom';
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'error';
  payment_method?: string;
  swish_uuid?: string;
  qliro_order_id?: string;
  payment_reference?: string;
  issued_at: string;
  due_date?: string;
  paid_at?: string;
  notes?: string;
  items: InvoiceItem[];
  booking_id?: string;
  package_id?: string;
  lesson_type_name?: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  transmission_type?: string;
  user_id?: string;
  created_at?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType?: string;
  itemReference?: string;
}

interface UserCredits {
  creditsRemaining: number;
  lessonTypeId: string;
  packageName: string;
}

export default function PaymentHubPage() {
  const params = useParams();
  const router = useNextRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<UserCredits[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownText, setCountdownText] = useState<string>('');
  const [paymentExpired, setPaymentExpired] = useState(false);

  // Payment dialogs
  const [showSwishDialog, setShowSwishDialog] = useState(false);
  const [showQliroDialog, setShowQliroDialog] = useState(false);
  const [qliroData, setQliroData] = useState<{ checkoutUrl: string; purchaseId: string } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load invoice data
  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
      loadUserCredits();
    }
  }, [invoiceId]);

  // Countdown timer for upcoming classes
  useEffect(() => {
    if (invoice && invoice.status === 'paid' && invoice.scheduled_date) {
      const classDateTime = new Date(`${invoice.scheduled_date}T${invoice.start_time || '00:00'}`);
      const now = new Date();

      if (classDateTime > now) {
        const timeDiff = classDateTime.getTime() - now.getTime();

        const updateCountdown = () => {
          const remaining = Math.max(0, classDateTime.getTime() - new Date().getTime());

          if (remaining <= 0) {
            setCountdown(null);
            setCountdownText('Klassen börjar snart!');
            return;
          }

          const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setCountdownText(`${days} dagar, ${hours} timmar, ${minutes} minuter`);
          } else if (hours > 0) {
            setCountdownText(`${hours} timmar, ${minutes} minuter`);
          } else {
            setCountdownText(`${minutes} minuter`);
          }
          setCountdown(remaining);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute

        return () => clearInterval(interval);
      }
    }
  }, [invoice]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/invoices/${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        const invoiceData = data.invoice;
        setInvoice(invoiceData);

        // Check if payment has expired for non-student users
        if (invoiceData.status === 'pending' && invoiceData.created_at) {
          const createdTime = new Date(invoiceData.created_at).getTime();
          const currentTime = new Date().getTime();
          const timeElapsed = currentTime - createdTime;
          const timeLimit = 120 * 60 * 1000; // 120 minutes in milliseconds

          if (timeElapsed >= timeLimit) {
            setPaymentExpired(true);
            // Auto-cancel expired invoice
            handlePaymentExpired();
          } else {
            // Start countdown for remaining time
            const timeLeft = Math.max(0, timeLimit - timeElapsed);
            startPaymentCountdown(timeLeft);
          }
        }
      } else {
        toast.error('Faktura hittades inte');
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Kunde inte ladda faktura');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentCountdown = (timeLeft: number) => {
    setCountdown(Math.floor(timeLeft / 1000));

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setPaymentExpired(true);
          handlePaymentExpired();
          return 0;
        }

        const newTime = prev - 1;
        const hours = Math.floor(newTime / 3600);
        const minutes = Math.floor((newTime % 3600) / 60);
        const seconds = newTime % 60;

        if (hours > 0) {
          setCountdownText(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setCountdownText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }

        return newTime;
      });
    }, 1000);
  };

  const handlePaymentExpired = async () => {
    if (!invoice) return;

    try {
      // Cancel the expired invoice
      const response = await fetch('/api/booking/payment-timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: invoice.booking_id || invoice.id,
          invoiceId: invoice.id,
          reason: 'Payment timeout - 120 minutes expired (Payment Hub)'
        }),
      });

      if (response.ok) {
        toast.error('Betalningstiden har gått ut. Fakturan har avbokats.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Error handling payment expiry:', error);
    }
  };

  const loadUserCredits = async () => {
    if (!invoice?.user_id) return;

    try {
      setLoadingCredits(true);
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || []);
      }
    } catch (error) {
      console.error('Error loading user credits:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-8 h-8 text-gray-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'success',
      pending: 'warning',
      overdue: 'failure',
      cancelled: 'gray',
      error: 'failure'
    };

    const labels = {
      paid: 'Betald',
      pending: 'Väntar på betalning',
      overdue: 'Försenad betalning',
      cancelled: 'Avbruten',
      error: 'Betalningsfel'
    };

    return (
      <Badge color={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      booking: 'blue',
      handledar: 'purple',
      package: 'green',
      custom: 'orange'
    };

    const labels = {
      booking: 'Körlektion',
      handledar: 'Handledarutbildning',
      package: 'Lektionspaket',
      custom: 'Anpassad tjänst'
    };

    return (
      <Badge color={variants[type as keyof typeof variants] || variants.custom}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const handleSwishPayment = () => {
    if (invoice) {
      setSwishPaymentData({
        amount: invoice.amount,
        message: `Faktura ${invoice.invoice_number} - ${invoice.amount} SEK`,
        swishNumber: process.env.NEXT_PUBLIC_SWISH_NUMBER || '1231231231',
        purchaseId: invoice.id
      });
    }
    setShowSwishDialog(true);
  };

  const handleQliroPayment = async () => {
    try {
      setProcessingPayment(true);

      const response = await fetch('/api/payments/qliro/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice?.id,
          amount: invoice?.amount,
          description: invoice?.description || `Faktura ${invoice?.invoice_number}`,
          reference: `invoice_${invoice?.id}`,
          customerEmail: invoice?.customer_email,
          customerPhone: invoice?.customer_phone,
          customerName: invoice?.customer_name
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Use flow manager to handle checkout display
        const { QliroFlowManager } = await import('@/lib/payment/qliro-flow-manager');
        await QliroFlowManager.openQliroCheckout({
          orderId: String(data.checkoutId),
          amount: invoice?.amount || 0,
          description: invoice?.description || `Faktura ${invoice?.invoice_number}`,
          checkoutUrl: data.checkoutUrl,
          onCompleted: () => {
            toast.success('Betalning genomförd! Sidan laddas om...');
            setTimeout(() => window.location.reload(), 1500);
          },
          onError: (error) => {
            console.error('Qliro payment error:', error);
            toast.error(`Betalningsfel: ${error.message || 'Ett fel uppstod'}`);
          }
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte skapa Qliro-betalning');
      }
    } catch (error) {
      console.error('Error creating Qliro payment:', error);
      toast.error('Tekniskt fel vid betalning');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreditPayment = async () => {
    if (!invoice) return;

    const availableCredit = userCredits.find(c => c.creditsRemaining > 0);
    if (!availableCredit) {
      toast.error('Inga tillgängliga krediter');
      return;
    }

    try {
      setProcessingPayment(true);

      const response = await fetch(`/api/invoices/${invoice.id}/pay-with-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditId: availableCredit.lessonTypeId
        })
      });

      if (response.ok) {
        toast.success('Betalning med krediter lyckades!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte behandla kreditbetalning');
      }
    } catch (error) {
      console.error('Error processing credit payment:', error);
      toast.error('Ett fel inträffade vid betalning med krediter');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayOnLocation = async () => {
    try {
      setProcessingPayment(true);

      const response = await fetch(`/api/invoices/${invoice?.id}/mark-pay-on-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice?.id
        })
      });

      if (response.ok) {
        toast.success('Betalning markerad för platsbetalning!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte markera för platsbetalning');
      }
    } catch (error) {
      console.error('Error marking pay on location:', error);
      toast.error('Ett fel inträffade');
    } finally {
      setProcessingPayment(false);
    }
  };

  const hasCreditsForPayment = () => {
    return userCredits.some(c => c.creditsRemaining > 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string, timeString?: string) => {
    if (!timeString) return '';
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInvoiceTitle = (invoice: Invoice) => {
    if (invoice.type === 'booking' && invoice.lesson_type_name) {
      return `${invoice.lesson_type_name} - ${formatDate(invoice.scheduled_date || invoice.issued_at)}`;
    }
    if (invoice.type === 'package' && invoice.description) {
      return invoice.description;
    }
    return invoice.description || 'Faktura';
  };

  const getPaymentDescription = (invoice: Invoice) => {
    if (invoice.type === 'booking') {
      return `Betalning för körlektion${invoice.scheduled_date ? ` den ${formatDate(invoice.scheduled_date)}${invoice.start_time ? ` kl. ${formatTime(invoice.scheduled_date, invoice.start_time)}` : ''}` : ''}`;
    }
    if (invoice.type === 'package') {
      return 'Betalning för lektionspaket med flera körlektioner till rabatterat pris';
    }
    return invoice.description || 'Betalning för tjänst';
  };

  const getUrgencyMessage = (invoice: Invoice) => {
    if (invoice.status !== 'pending') return null;

    if (invoice.scheduled_date) {
      const classDate = new Date(invoice.scheduled_date);
      const now = new Date();
      const daysUntilClass = Math.ceil((classDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilClass <= 1) {
        return {
          message: '🚨 Betala nu - lektionen börjar snart!',
          color: 'red'
        };
      } else if (daysUntilClass <= 3) {
        return {
          message: '⏰ Betala snart - lektionen närmar sig',
          color: 'yellow'
        };
      }
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <OrbSpinner size="lg" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Laddar Betalhubben...</h2>
            <p className="text-gray-600">Hämtar fakturainformation</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto bg-white border-2 border-red-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Faktura hittades inte</h2>
            <p className="text-red-700 mb-6">
              Den efterfrågade fakturan kunde inte hittas eller har gått ut.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-700"
            >
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const urgencyMessage = getUrgencyMessage(invoice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <TrueFocusText
                  texts={["Betalhubben"]}
                  interval={3000}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(invoice.status)}
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Timer Alert */}
        {countdown !== null && countdown > 0 && (
          <Card className={`mb-8 border-2 ${
            countdown < 600 ? 'border-red-300 bg-red-50' :
            countdown < 1800 ? 'border-yellow-300 bg-yellow-50' :
            'border-blue-300 bg-blue-50'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Timer className={`w-6 h-6 ${
                    countdown < 600 ? 'text-red-500' :
                    countdown < 1800 ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div>
                    <p className={`font-semibold ${
                      countdown < 600 ? 'text-red-900' :
                      countdown < 1800 ? 'text-yellow-900' :
                      'text-blue-900'
                    }`}>
                      {countdown < 600 ? '⏰ Betalningstiden håller på att gå ut!' :
                       countdown < 1800 ? '⏰ Betalningstiden närmar sig slutet' :
                       '⏰ Betalningstid kvar'}
                    </p>
                    <p className={`text-sm ${
                      countdown < 600 ? 'text-red-700' :
                      countdown < 1800 ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      Eftersom du inte är inloggad som student har du begränsad tid att betala.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    countdown < 600 ? 'text-red-600' :
                    countdown < 1800 ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {countdownText}
                  </div>
                  <p className="text-sm text-gray-600">kvar att betala</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Expired Alert */}
        {paymentExpired && (
          <Card className="mb-8 border-2 border-red-300 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="text-xl font-bold text-red-900">Betalningstiden har gått ut</h3>
                  <p className="text-red-700 mt-1">Denna faktura har avbokats automatiskt.</p>
                </div>
              </div>
              <p className="text-red-600 mb-4">
                Du dirigeras tillbaka till startsidan om några sekunder...
              </p>
              <Button
                onClick={() => router.push('/')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Tillbaka till startsidan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Urgency Alert */}
        {urgencyMessage && !paymentExpired && countdown === null && (
          <Card className={`mb-8 border-2 ${
            urgencyMessage.color === 'red' ? 'border-red-300 bg-red-50' :
            urgencyMessage.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' :
            'border-blue-300 bg-blue-50'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-6 h-6 ${
                  urgencyMessage.color === 'red' ? 'text-red-500' :
                  urgencyMessage.color === 'yellow' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <p className={`font-semibold ${
                  urgencyMessage.color === 'red' ? 'text-red-900' :
                  urgencyMessage.color === 'yellow' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>
                  {urgencyMessage.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Summary - Colorful and Clear */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-bold">Faktura {invoice.invoice_number}</h1>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-2">{getInvoiceTitle(invoice)}</h2>
                <p className="text-white/90 mb-4">{getPaymentDescription(invoice)}</p>

                <div className="text-4xl font-bold mb-2">
                  {invoice.amount} {invoice.currency}
                </div>
                <p className="text-white/80 text-sm">Att betala</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {invoice.status === 'paid' ? (
          /* PAID INVOICE - Thank You Page */
          <div className="space-y-8">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <div>
                    <h2 className="text-3xl font-bold text-green-900">Tack för din betalning!</h2>
                    <p className="text-green-700 mt-2">Din faktura är nu betald och klar</p>
                  </div>
                </div>

                {invoice.paid_at && (
                  <p className="text-green-600 mb-6">
                    Betald: {formatDate(invoice.paid_at)}
                  </p>
                )}

                {countdown !== null && invoice.scheduled_date && (
                  <div className="bg-white/50 rounded-xl p-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Timer className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-900">Nedräkning till lektion</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-2">
                      {countdownText}
                    </div>
                    <p className="text-green-700">
                      {invoice.lesson_type_name} den {formatDate(invoice.scheduled_date)}
                      {invoice.start_time && ` kl. ${formatTime(invoice.scheduled_date, invoice.start_time)}`}
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <p className="text-green-800 font-medium">Vad händer nu?</p>
                  <ul className="text-left text-green-700 space-y-2 max-w-md mx-auto">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Din bokning är bekräftad
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Du får en påminnelse innan lektionen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Körläraren har fått besked om betalningen
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : paymentExpired ? (
          /* PAYMENT EXPIRED - Show expired message */
          <div className="space-y-8">
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <AlertTriangle className="w-16 h-16 text-red-500" />
                  <div>
                    <h2 className="text-3xl font-bold text-red-900">Betalningstiden har gått ut</h2>
                    <p className="text-red-700 mt-2">Denna faktura har avbokats och betalning är inte längre möjlig.</p>
                  </div>
                </div>

                <div className="bg-white/50 rounded-xl p-6 mb-6">
                  <p className="text-red-800 mb-4">
                    Fakturan och den associerade bokningen har automatiskt avbokats efter 120 minuter.
                    Om du fortfarande behöver boka en lektion, vänligen skapa en ny bokning.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    asChild
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Link href="/boka-korning">
                      <Car className="w-4 h-4 mr-2" />
                      Boka ny lektion
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Link href="/">
                      Tillbaka till startsidan
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* UNPAID INVOICE - Payment Options */
          <div className="space-y-8">
            {/* Invoice Details */}
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fakturadetaljer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fakturanummer</p>
                      <p className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Typ</p>
                      <div className="mt-1">{getTypeBadge(invoice.type)}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utfärdad</p>
                      <p className="text-lg text-gray-900">{formatDate(invoice.issued_at)}</p>
                    </div>
                    {invoice.due_date && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Förfallodatum</p>
                        <p className="text-lg text-gray-900">{formatDate(invoice.due_date)}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Belopp att betala</p>
                      <p className="text-3xl font-bold text-blue-600">{invoice.amount} {invoice.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods - Enhanced Awesome UI */}
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-gray-900">Välj betalningsmetod</h2>
                <p className="text-gray-600">Snabb, säker och enkel betalning för din tjänst</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Swish Payment - Enhanced */}
                <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-300 hover:shadow-2xl hover:border-green-400 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    {/* Animated QR Icon */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Smartphone className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>

                    <h3 className="text-2xl font-bold text-green-900 mb-3 group-hover:text-green-800 transition-colors">Swish</h3>
                    <p className="text-green-700 mb-6 leading-relaxed">✨ Öppna Swish-appen, scanna QR-koden och betalning är klar på sekunder!</p>

                    {/* Enhanced Payment Info */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 mb-6 border border-green-200/50 shadow-sm">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-green-900">Betalningsinformation</p>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-green-700">Belopp:</span>
                          <span className="font-bold text-green-900">{invoice.amount} {invoice.currency}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-green-700">Faktura:</span>
                          <span className="font-mono text-green-900">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-green-700">Mottagare:</span>
                          <span className="text-green-900">Trafikskola Hässleholm</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSwishPayment}
                      disabled={processingPayment}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                    >
                      {processingPayment ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Bearbetar...
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-5 h-5 mr-2" />
                          🚀 Betala med Swish
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-green-600 mt-3">⚡ Genomsnittlig betalningstid: 15 sekunder</p>
                  </CardContent>
                </Card>

                {/* Qliro Payment - Enhanced */}
                <Card className="bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 border-2 border-purple-300 hover:shadow-2xl hover:border-purple-400 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    {/* Animated Card Icon */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <CreditCard className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>

                    <h3 className="text-2xl font-bold text-purple-900 mb-3 group-hover:text-purple-800 transition-colors">Qliro</h3>
                    <p className="text-purple-700 mb-6 leading-relaxed">💳 Betala med kort, Swish eller dela upp på faktura - helt utan konto!</p>

                    {/* Enhanced Payment Options */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 mb-6 border border-purple-200/50 shadow-sm">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-purple-900">Betalningsalternativ</p>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-purple-700">Kort</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-purple-700">Swish</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-purple-700">Faktura</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-purple-700">Delbetalning</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleQliroPayment}
                      disabled={processingPayment}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                    >
                      {processingPayment ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Bearbetar...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          🌟 Betala med Qliro
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-purple-600 mt-3">🔒 Säker betalning med 256-bit SSL kryptering</p>
                  </CardContent>
                </Card>

                {/* Credit Payment - Enhanced */}
                {hasCreditsForPayment() && (
                  <Card className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 border-2 border-yellow-300 hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 text-center relative z-10">
                      {/* Animated Coins Icon */}
                      <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <Coins className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{userCredits.find(c => c.creditsRemaining > 0)?.creditsRemaining || 0}</span>
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-yellow-900 mb-3 group-hover:text-yellow-800 transition-colors">Krediter</h3>
                      <p className="text-yellow-700 mb-6 leading-relaxed">💰 Använd dina förbetalda krediter för omedelbar betalning!</p>

                      {/* Enhanced Credit Info */}
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 mb-6 border border-yellow-200/50 shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <p className="text-sm font-semibold text-yellow-900">Tillgängliga krediter</p>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-900 mb-1">
                            {userCredits.find(c => c.creditsRemaining > 0)?.creditsRemaining || 0}
                          </div>
                          <p className="text-sm text-yellow-700">krediter kvar</p>
                        </div>
                      </div>

                      <Button
                        onClick={handleCreditPayment}
                        disabled={processingPayment}
                        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                      >
                        {processingPayment ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Bearbetar...
                          </>
                        ) : (
                          <>
                            <Coins className="w-5 h-5 mr-2" />
                            ✨ Betala med krediter
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-yellow-600 mt-3">🚀 Omedelbar aktivering efter betalning</p>
                    </CardContent>
                  </Card>
                )}

                {/* Pay on Location - Enhanced */}
                <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-300 hover:shadow-2xl hover:border-blue-400 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    {/* Animated Location Icon */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Building2 className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">💳</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-blue-900 mb-3 group-hover:text-blue-800 transition-colors">Betala på plats</h3>
                    <p className="text-blue-700 mb-6 leading-relaxed">🏢 Ingen stress - betala bekvämt vid lektionstillfället!</p>

                    {/* Enhanced Location Info */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 mb-6 border border-blue-200/50 shadow-sm">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-blue-900">Betalningsalternativ på plats</p>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-blue-700">Kontant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-700">Kort</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-blue-700">Swish</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-blue-700">Faktura</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayOnLocation}
                      disabled={processingPayment}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                    >
                      {processingPayment ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Bearbetar...
                        </>
                      ) : (
                        <>
                          <Building2 className="w-5 h-5 mr-2" />
                          🏢 Betala på plats
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-blue-600 mt-3">📍 Betala direkt till din instruktör</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Package Suggestion */}
            {invoice.type === 'booking' && (
              <Card className="bg-gradient-to-r from-indigo-50 to-pink-50 border-2 border-indigo-200">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-indigo-900">Spara pengar med paket!</h3>
                      <p className="text-indigo-700">Köp flera lektioner samtidigt och få rabatt</p>
                    </div>
                  </div>

                  <div className="bg-white/50 rounded-xl p-6">
                    <p className="text-indigo-800 mb-4">
                      Genom att köpa ett lektionspaket sparar du upp till 15% jämfört med att betala per lektion.
                      Perfekt om du planerar att ta flera körlektioner!
                    </p>

                    <Button
                      asChild
                      className="bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold"
                    >
                      <Link href="/paketbutik">
                        <Package className="w-5 h-5 mr-2" />
                        Se paketpriser
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer Branding */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Powered by <span className="font-bold text-blue-600">Betalhubben</span>
            </span>
          </div>
        </div>
      </div>

      {/* Payment Dialogs */}
      {showSwishDialog && (
        <SwishPaymentDialog
          isOpen={showSwishDialog}
          onClose={() => setShowSwishDialog(false)}
          booking={{ id: `invoice_${invoice?.id}`, totalPrice: invoice?.amount || 0 }}
          customMessage={`Faktura ${invoice?.invoice_number} - ${invoice?.amount} ${invoice?.currency}`}
          mode="package"
          onConfirm={async () => {
            try {
              // Notify admin about Swish payment for invoice
              const response = await fetch('/api/invoices/notify-swish-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  invoiceId: invoice?.id,
                  swishMessage: `Faktura ${invoice?.invoice_number} - ${invoice?.amount} ${invoice?.currency}`
                })
              });
              
              if (response.ok) {
                toast.success('Tack! Skolan har meddelats om din Swish-betalning.');
              } else {
                toast.error('Kunde inte meddela skolan. Kontakta oss direkt.');
              }
            } catch (error) {
              console.error('Failed to notify admin:', error);
              toast.error('Kunde inte meddela skolan. Kontakta oss direkt.');
            }
            setShowSwishDialog(false);
          }}
        />
      )}

      {showQliroDialog && qliroData && (
        <QliroPaymentDialog
          isOpen={showQliroDialog}
          onClose={() => setShowQliroDialog(false)}
          purchaseId={qliroData.purchaseId}
          amount={invoice?.amount || 0}
          checkoutUrl={qliroData.checkoutUrl}
          onConfirm={() => {
            setShowQliroDialog(false);
            setTimeout(() => window.location.reload(), 1500);
          }}
        />
      )}
    </div>
  );
}
