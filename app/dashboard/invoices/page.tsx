'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Download,
  Eye,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  type: 'booking' | 'handledar' | 'package' | 'custom';
  description?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'error';
  issued_at: string;
  due_date?: string;
  paid_at?: string;
  item_count?: number;
}

export default function CustomerInvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load invoices
  useEffect(() => {
    if (user && user.role === 'student') {
      loadInvoices();
    }
  }, [user, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        toast.error('Failed to load invoices');
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (invoiceId: string, invoiceNumber: string) => {
    const link = document.createElement('a');
    link.href = `/api/invoices/${invoiceId}/pdf`;
    link.download = `faktura-${invoiceNumber}.pdf`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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
      pending: 'Väntar',
      overdue: 'Försenad',
      cancelled: 'Avbruten',
      error: 'Fel'
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
      package: 'Paket',
      custom: 'Anpassad'
    };

    return (
      <Badge className={variants[type as keyof typeof variants] || variants.custom}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice =>
    (searchTerm === '' ||
     invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Laddar...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mina Fakturor</h1>
          <p className="text-gray-600">Hantera och visa dina fakturor</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrera fakturor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök efter fakturanummer eller beskrivning..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla statusar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="pending">Väntar</SelectItem>
                <SelectItem value="paid">Betald</SelectItem>
                <SelectItem value="overdue">Försenad</SelectItem>
                <SelectItem value="cancelled">Avbruten</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Fakturor ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Laddar fakturor...</div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inga fakturor hittades</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Prova att ändra dina filter.'
                  : 'Du har inga fakturor ännu.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{invoice.invoice_number}</h3>
                        {getStatusIcon(invoice.status)}
                        {getStatusBadge(invoice.status)}
                        {getTypeBadge(invoice.type)}
                      </div>

                      {invoice.description && (
                        <p className="text-gray-600">{invoice.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Utfärdad:</span>
                          <p>{new Date(invoice.issued_at).toLocaleDateString('sv-SE')}</p>
                        </div>
                        {invoice.due_date && (
                          <div>
                            <span className="font-medium">Förfallodatum:</span>
                            <p>{new Date(invoice.due_date).toLocaleDateString('sv-SE')}</p>
                          </div>
                        )}
                        {invoice.paid_at && (
                          <div>
                            <span className="font-medium">Betald:</span>
                            <p>{new Date(invoice.paid_at).toLocaleDateString('sv-SE')}</p>
                          </div>
                        )}
                      </div>

                      {invoice.item_count && (
                        <p className="text-sm text-gray-500">
                          {invoice.item_count} {invoice.item_count === 1 ? 'artikel' : 'artiklar'}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-3">
                      <div className="text-2xl font-bold">
                        {invoice.amount} {invoice.currency}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Visa
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Behöver du hjälp?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Frågor om fakturor?</strong> Kontakta oss på{' '}
              <a href="mailto:info@dintrafikskolahlm.se" className="text-blue-600 hover:underline">
                info@dintrafikskolahlm.se
              </a>{' '}
              eller ring 040-123 45 67
            </p>
            <p>
              <strong>Betalningsproblem?</strong> Vi accepterar Swish, kortbetalning och bankgiro.
              Ange alltid fakturanummer som referens vid betalning.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
