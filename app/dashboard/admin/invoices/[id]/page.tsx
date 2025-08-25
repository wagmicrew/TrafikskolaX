'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useRouter as useNextRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Phone,
  AtSign
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  type: 'booking' | 'handledar' | 'package' | 'custom';
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
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
  last_reminder_sent?: string;
  notes?: string;
  internal_notes?: string;
  reminder_count: number;
  items: InvoiceItem[];
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useNextRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load invoice data
  useEffect(() => {
    if (user && user.role === 'admin' && params.id) {
      loadInvoice();
    }
  }, [user, params.id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
      } else {
        toast.error('Failed to load invoice');
        router.push('/dashboard/admin/invoices');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/invoices/${params.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'admin' })
      });

      if (response.ok) {
        toast.success('Invoice marked as paid');
        loadInvoice(); // Refresh invoice data
      } else {
        toast.error('Failed to mark invoice as paid');
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to mark invoice as paid');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/invoices/${params.id}/remind`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Reminder sent successfully');
        loadInvoice(); // Refresh invoice data
      } else {
        toast.error('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = `/api/admin/invoices/${params.id}/pdf`;
    link.download = `faktura-${invoice?.invoice_number || params.id}.pdf`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
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

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
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
      booking: 'Bokning',
      handledar: 'Handledar',
      package: 'Paket',
      custom: 'Anpassad'
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
          <div className="text-gray-500">Invoice not found</div>
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
            onClick={() => router.push('/dashboard/admin/invoices')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Faktura {invoice.invoice_number}</h1>
            <p className="text-gray-600">Fakturadetaljer och hantering</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusIcon(invoice.status)}
          {getStatusBadge(invoice.status)}
          {getTypeBadge(invoice.type)}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snabba åtgärder</CardTitle>
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
              <>
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={updating}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  {updating ? 'Uppdaterar...' : 'Markera som betald'}
                </Button>

                <Button
                  onClick={handleSendReminder}
                  disabled={updating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {updating ? 'Skickar...' : 'Skicka påminnelse'}
                </Button>
              </>
            )}

            <Button
              onClick={() => router.push(`/dashboard/admin/invoices/${params.id}/edit`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Redigera
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Grundläggande information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fakturanummer</Label>
                  <p className="text-lg font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Typ</Label>
                  <div className="text-lg mt-1">{getTypeBadge(invoice.type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Utfärdad</Label>
                  <p className="text-lg">{new Date(invoice.issued_at).toLocaleDateString('sv-SE')}</p>
                </div>
                {invoice.due_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Förfallodatum</Label>
                    <p className="text-lg">{new Date(invoice.due_date).toLocaleDateString('sv-SE')}</p>
                  </div>
                )}
                {invoice.paid_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Betald</Label>
                    <p className="text-lg">{new Date(invoice.paid_at).toLocaleDateString('sv-SE')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Belopp</Label>
                  <p className="text-2xl font-bold">{invoice.amount} {invoice.currency}</p>
                </div>
              </div>

              {invoice.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Beskrivning</Label>
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
                  <div key={item.id || index} className="flex justify-between items-center p-3 border rounded-lg">
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
                  <span>Total</span>
                  <span>{invoice.amount} {invoice.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(invoice.notes || invoice.internal_notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Noteringar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Kundnotering</Label>
                    <p className="text-lg mt-1">{invoice.notes}</p>
                  </div>
                )}
                {invoice.internal_notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Intern notering</Label>
                    <p className="text-lg mt-1">{invoice.internal_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Customer Information */}
        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Kundinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold">
                    {invoice.customer_name || (invoice.customer ? `${invoice.customer.firstName} ${invoice.customer.lastName}` : 'Okänd kund')}
                  </p>
                  {invoice.customer_id && (
                    <p className="text-sm text-gray-600">Kund-ID: {invoice.customer_id}</p>
                  )}
                </div>
              </div>

              {invoice.customer_email && (
                <div className="flex items-center gap-3">
                  <AtSign className="w-5 h-5 text-gray-400" />
                  <p>{invoice.customer_email}</p>
                </div>
              )}

              {invoice.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <p>{invoice.customer_phone}</p>
                </div>
              )}

              {invoice.customer_id && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/admin/users/${invoice.customer_id}`)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visa kundprofil
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Betalningsinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Betalningsmetod</Label>
                <p className="text-lg">{invoice.payment_method || 'Ej angiven'}</p>
              </div>

              {invoice.payment_reference && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Betalningsreferens</Label>
                  <p className="text-lg font-mono">{invoice.payment_reference}</p>
                </div>
              )}

              {invoice.swish_uuid && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Swish UUID</Label>
                  <p className="text-lg font-mono break-all">{invoice.swish_uuid}</p>
                </div>
              )}

              {invoice.qliro_order_id && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Qliro Order ID</Label>
                  <p className="text-lg font-mono break-all">{invoice.qliro_order_id}</p>
                </div>
              )}

              {invoice.reminder_count > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Påminnelser skickade</Label>
                  <p className="text-lg">{invoice.reminder_count}</p>
                  {invoice.last_reminder_sent && (
                    <p className="text-sm text-gray-600">
                      Senast: {new Date(invoice.last_reminder_sent).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
