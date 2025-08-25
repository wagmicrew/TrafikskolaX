'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter as useNextRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Phone,
  AtSign,
  CreditCard,
  MapPin
} from 'lucide-react';

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

export default function CustomerInvoiceDetailPage() {
  const params = useParams();
  const router = useNextRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load invoice data
  useEffect(() => {
    if (user && user.role === 'student' && params.id) {
      loadInvoice();
    }
  }, [user, params.id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
      } else {
        toast.error('Faktura hittades inte');
        router.push('/dashboard/invoices');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Kunde inte ladda faktura');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = `/api/invoices/${params.id}/pdf`;
    link.download = `faktura-${invoice?.invoice_number || params.id}.pdf`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-gray-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    };

    const labels = {
      paid: 'Betald',
      pending: 'Väntar på betalning',
      overdue: 'Försenad betalning',
      cancelled: 'Avbruten',
      error: 'Betalningsfel'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      booking: 'bg-blue-100 text-blue-800',
      handledar: 'bg-purple-100 text-purple-800',
      package: 'bg-green-100 text-green-800',
      custom: 'bg-orange-100 text-orange-800'
    };

    const labels = {
      booking: 'Körlektion',
      handledar: 'Handledarutbildning',
      package: 'Lektionspaket',
      custom: 'Anpassad tjänst'
    };

    return (
      <Badge className={variants[type as keyof typeof variants] || variants.custom}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Laddar...</div>;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Laddar faktura...</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Faktura hittades inte</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/invoices')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till fakturor
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Faktura {invoice.invoice_number}</h1>
            <p className="text-gray-600">Visa fakturadetaljer och betalningsinformation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusIcon(invoice.status)}
          {getStatusBadge(invoice.status)}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Åtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Ladda ned PDF
            </Button>

            {invoice.status === 'pending' && (
              <Button
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="w-4 h-4" />
                Betala nu
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Fakturainformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fakturanummer</p>
                  <p className="text-lg font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Typ</p>
                  <div className="text-lg mt-1">{getTypeBadge(invoice.type)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Utfärdad</p>
                  <p className="text-lg">{new Date(invoice.issued_at).toLocaleDateString('sv-SE')}</p>
                </div>
                {invoice.due_date && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Förfallodatum</p>
                    <p className="text-lg">{new Date(invoice.due_date).toLocaleDateString('sv-SE')}</p>
                  </div>
                )}
                {invoice.paid_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Betald</p>
                    <p className="text-lg">{new Date(invoice.paid_at).toLocaleDateString('sv-SE')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Belopp</p>
                  <p className="text-2xl font-bold">{invoice.amount} {invoice.currency}</p>
                </div>
              </div>

              {invoice.description && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Beskrivning</p>
                  <p className="text-lg">{invoice.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Fakturarader</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      {item.itemType && (
                        <p className="text-sm text-gray-600">Typ: {item.itemType}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.quantity} x {item.unitPrice} {invoice.currency}</p>
                      <p className="text-lg font-bold">{item.totalPrice} {invoice.currency}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total att betala</span>
                  <span>{invoice.amount} {invoice.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Noteringar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Information */}
        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Fakturerad till</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Namn</p>
                  <p className="text-lg">{invoice.customer_name || user?.first_name + ' ' + user?.last_name || 'Okänd kund'}</p>
                </div>

                {invoice.customer_email && (
                  <div className="flex items-center gap-3">
                    <AtSign className="w-4 h-4 text-gray-400" />
                    <p>{invoice.customer_email}</p>
                  </div>
                )}

                {invoice.customer_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p>{invoice.customer_phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Betalningsinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Betalningsmetod</p>
                <p className="text-lg">{invoice.payment_method || 'Ej angiven'}</p>
              </div>

              {invoice.payment_reference && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Betalningsreferens</p>
                  <p className="text-lg font-mono">{invoice.payment_reference}</p>
                </div>
              )}

              {invoice.status === 'pending' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Hur betalar jag?</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Swish:</strong> Öppna Swish-appen och ange beloppet {invoice.amount} {invoice.currency}</p>
                    <p><strong>Kortbetalning:</strong> Klicka på "Betala nu" ovan</p>
                    <p><strong>Bankgiro:</strong> Använd BG 123-4567</p>
                    <p className="font-medium">Ange alltid fakturanummer {invoice.invoice_number} som referens!</p>
                  </div>
                </div>
              )}

              {invoice.status === 'paid' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-900 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Fakturan är betald</span>
                  </div>
                  <p className="text-sm text-green-800">
                    Tack för din betalning! Fakturan är nu markerad som betald.
                  </p>
                </div>
              )}

              {invoice.status === 'overdue' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-900 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Försenad betalning</span>
                  </div>
                  <p className="text-sm text-red-800 mb-3">
                    Denna faktura har passerat förfallodatumet. Vänligen betala så snart som möjligt.
                  </p>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Betala nu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <AtSign className="w-4 h-4 text-gray-400" />
                <a href="mailto:info@dintrafikskolahlm.se" className="text-blue-600 hover:underline">
                  info@dintrafikskolahlm.se
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="tel:0401234567" className="text-blue-600 hover:underline">
                  040-123 45 67
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>Storgatan 1, 281 31 Hässleholm</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
