'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
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
  paid_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  item_count?: number;
}

interface InvoiceStats {
  total_invoices: number;
  pending_count: number;
  paid_count: number;
  overdue_count: number;
  total_paid: number;
  total_pending: number;
}

export default function AdminInvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load data
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadInvoices();
      loadStats();
    }
  }, [user, statusFilter, typeFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/admin/invoices?${params.toString()}`);
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

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/invoices');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'admin' })
      });

      if (response.ok) {
        toast.success('Invoice marked as paid');
        loadInvoices();
        loadStats();
      } else {
        toast.error('Failed to mark invoice as paid');
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to mark invoice as paid');
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/remind`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Reminder sent successfully');
      } else {
        toast.error('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
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

    const labels: Record<string, string> = {
      paid: 'Betald',
      pending: 'Väntande...',
      overdue: 'Försenad',
      cancelled: 'Avbruten',
      error: 'Fel'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice =>
    (searchTerm === '' ||
     invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     invoice.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Laddar...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fakturahantering</h1>
          <p className="text-gray-600">Hantera alla fakturor och betalningar</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Skapa faktura
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Antal fakturor</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_invoices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Väntar</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_pending} SEK totalt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Betalda</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paid_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_paid} SEK totalt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Försenade</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdue_count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Sök</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Sök på fakturanummer, kundnamn eller e‑post..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
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

            <div>
              <Label htmlFor="type">Typ</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alla typer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla typer</SelectItem>
                  <SelectItem value="booking">Bokning</SelectItem>
                  <SelectItem value="handledar">Handledar</SelectItem>
                  <SelectItem value="package">Paket</SelectItem>
                  <SelectItem value="custom">Anpassad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fakturor ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Laddar fakturor...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{invoice.invoice_number}</h3>
                        {getStatusIcon(invoice.status)}
                        {getStatusBadge(invoice.status)}
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>Kund: {invoice.customer_name || invoice.customer_email || 'N/A'}</p>
                        <p>Beskrivning: {invoice.description || 'Ingen beskrivning'}</p>
                        <p>Utfärdad: {new Date(invoice.issued_at).toLocaleDateString('sv-SE')}</p>
                        {invoice.due_date && (
                          <p>Förfallodatum: {new Date(invoice.due_date).toLocaleDateString('sv-SE')}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-lg font-bold">
                        {invoice.amount} {invoice.currency}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/admin/invoices/${invoice.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Visa
                        </Button>

                        {invoice.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Markera som betald
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendReminder(invoice.id)}
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              Skicka påminnelse
                            </Button>
                          </>
                        )}

                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredInvoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Inga fakturor matchar din filtrering.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
