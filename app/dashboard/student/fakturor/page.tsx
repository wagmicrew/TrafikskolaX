'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/hooks/useAuth';
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
  FileText,
  Receipt,
  CreditCard,
  RefreshCw,
  Phone,
  Mail,
  HelpCircle,
  Calendar
} from 'lucide-react';
import StudentHeader from '../StudentHeader';
import Link from 'next/link';

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
  lesson_type_name?: string;
  scheduled_date?: string;
  package_name?: string;
}

export default function StudentInvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);

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
        setPendingInvoicesCount(data.invoices?.filter((inv: Invoice) => inv.status === 'pending').length || 0);
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
      package: 'Lektionspaket',
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

  const getInvoiceTitle = (invoice: Invoice) => {
    if (invoice.type === 'booking' && invoice.lesson_type_name) {
      return `${invoice.lesson_type_name} - ${new Date(invoice.scheduled_date || invoice.issued_at).toLocaleDateString('sv-SE')}`;
    }
    if (invoice.type === 'package' && invoice.package_name) {
      return invoice.package_name;
    }
    return invoice.description || 'Faktura';
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <StudentHeader
        title="Mina Fakturor"
        icon={<Receipt className="w-5 h-5" />}
        userName={user.firstName}
        notificationCount={pendingInvoicesCount}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Receipt className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mina Fakturor</h1>
                <p className="text-gray-600 mt-1">Hantera och betala dina fakturor från Trafikskola Hässleholm</p>
              </div>
            </div>

            {pendingInvoicesCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-900">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">
                    Du har {pendingInvoicesCount} obetald{pendingInvoicesCount === 1 ? '' : 'a'} {pendingInvoicesCount === 1 ? 'faktura' : 'fakturor'} som väntar på betalning.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="text-2xl text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Totalt fakturor</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="text-2xl text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Betald</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {invoices.filter(inv => inv.status === 'paid').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="text-2xl text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Väntar</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {invoices.filter(inv => inv.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="text-2xl text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Försenad</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {invoices.filter(inv => inv.status === 'overdue').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Filtrera fakturor</CardTitle>
            <CardDescription>Sök och filtrera dina fakturor</CardDescription>
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

              <Button
                onClick={loadInvoices}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uppdaterar...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Uppdatera
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Fakturor ({filteredInvoices.length})</CardTitle>
            <CardDescription>
              {statusFilter !== 'all' ? `Visar endast ${statusFilter === 'pending' ? 'väntande' : statusFilter === 'paid' ? 'betalda' : statusFilter === 'overdue' ? 'försenade' : statusFilter === 'cancelled' ? 'avbrutna' : statusFilter} fakturor` : 'Alla dina fakturor'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Laddar fakturor...</p>
                </div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Inga fakturor hittades</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Prova att ändra dina filter eller sökord.'
                    : 'Du har inga fakturor ännu. Fakturor skapas automatiskt när du bokar lektioner eller köper paket.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/dashboard/student/bokningar">
                      <Calendar className="w-4 h-4 mr-2" />
                      Boka lektion
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/paketbutik">
                      <Receipt className="w-4 h-4 mr-2" />
                      Se paket
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</h3>
                          {getStatusIcon(invoice.status)}
                          {getStatusBadge(invoice.status)}
                          {getTypeBadge(invoice.type)}
                        </div>

                        <p className="text-gray-700 font-medium">{getInvoiceTitle(invoice)}</p>

                        {invoice.description && invoice.description !== getInvoiceTitle(invoice) && (
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

                      <div className="text-right space-y-3 ml-6">
                        <div className="text-2xl font-bold text-gray-900">
                          {invoice.amount} {invoice.currency}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Visa detaljer
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>

                          {invoice.status === 'pending' && (
                            <Button
                              asChild
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Link href={`/betalhubben/${invoice.id}`}>
                                <CreditCard className="w-4 h-4 mr-1" />
                                Betala nu
                              </Link>
                            </Button>
                          )}
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
        <Card className="bg-gray-50 border border-gray-200 mt-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Behöver du hjälp med dina fakturor?</h3>
              <p className="text-gray-600 mb-4">
                Kontakta oss om du har frågor om dina fakturor eller betalningar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button color="gray" asChild>
                  <a href="tel:+464551234567">
                    <Phone className="w-4 h-4 mr-2" />
                    Ring oss: 0455-123 45 67
                  </a>
                </Button>
                <Button variant="outline" color="gray" asChild>
                  <a href="mailto:info@trafikskola-hassleholm.se">
                    <Mail className="w-4 h-4 mr-2" />
                    Skicka e-post
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/student/help">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Läs mer
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
