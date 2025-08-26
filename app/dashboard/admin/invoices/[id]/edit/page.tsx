'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter as useNextRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Calendar,
  User,
  Phone,
  AtSign,
  FileText
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
  issued_at: string;
  due_date?: string;
  notes?: string;
  internal_notes?: string;
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

export default function AdminInvoiceEditPage() {
  const params = useParams();
  const router = useNextRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    description: '',
    due_date: '',
    notes: '',
    internal_notes: ''
  });

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
        setFormData({
          customer_name: data.invoice.customer_name || '',
          customer_email: data.invoice.customer_email || '',
          customer_phone: data.invoice.customer_phone || '',
          description: data.invoice.description || '',
          due_date: data.invoice.due_date ? data.invoice.due_date.split('T')[0] : '',
          notes: data.invoice.notes || '',
          internal_notes: data.invoice.internal_notes || ''
        });
      } else {
        toast.error('Kunde inte ladda faktura');
        router.push('/dashboard/admin/invoices');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Kunde inte ladda faktura');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData = {
        customerName: formData.customer_name,
        customerEmail: formData.customer_email,
        customerPhone: formData.customer_phone,
        description: formData.description,
        dueDate: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        notes: formData.notes,
        internalNotes: formData.internal_notes
      };

      const response = await fetch(`/api/admin/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('Faktura uppdaterad framgångsrikt');
        router.push(`/dashboard/admin/invoices/${params.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte uppdatera faktura');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Kunde inte uppdatera faktura');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
            onClick={() => router.push(`/dashboard/admin/invoices/${params.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till faktura
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Redigera faktura {invoice.invoice_number}</h1>
            <p className="text-gray-600">Uppdatera fakturainformation</p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Kundinformation
            </CardTitle>
            <CardDescription>Uppdatera kundens kontaktuppgifter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Kundnamn</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Ange kundens namn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_email">E-postadress</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  placeholder="kund@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">Telefonnummer</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  placeholder="070-123 45 67"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fakturadetaljer
            </CardTitle>
            <CardDescription>Grundläggande fakturainformation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Beskrivning av fakturan..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Förfallodatum</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fakturanummer</Label>
                <p className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</p>
              </div>
              <div className="space-y-2">
                <Label>Utfärdad</Label>
                <p className="text-lg text-gray-900">{new Date(invoice.issued_at).toLocaleDateString('sv-SE')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Noteringar</CardTitle>
            <CardDescription>Kund- och interna noteringar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Kundnotering</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notering som kunden kan se..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal_notes">Intern notering</Label>
              <Textarea
                id="internal_notes"
                value={formData.internal_notes}
                onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                placeholder="Intern notering (endast synlig för admin)..."
                rows={3}
                className="bg-yellow-50 border-yellow-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Fakturasammanfattning</CardTitle>
            <CardDescription>Oföränderliga fakturadetaljer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Belopp:</span>
              <span className="text-2xl font-bold">{invoice.amount} {invoice.currency}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{getStatusLabel(invoice.status)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Typ:</span>
              <span className="font-medium">{getTypeLabel(invoice.type)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Betalningsmetod:</span>
              <span className="font-medium">{invoice.payment_method || 'Ej angiven'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels = {
    pending: 'Väntar på betalning',
    paid: 'Betald',
    overdue: 'Försenad betalning',
    cancelled: 'Avbruten',
    error: 'Betalningsfel'
  };
  return labels[status as keyof typeof labels] || status;
}

function getTypeLabel(type: string): string {
  const labels = {
    booking: 'Körlektion',
    handledar: 'Handledarutbildning',
    package: 'Lektionspaket',
    custom: 'Anpassad tjänst'
  };
  return labels[type as keyof typeof labels] || type;
}
