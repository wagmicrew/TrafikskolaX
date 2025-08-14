'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, RefreshCw, CreditCard, Calendar, User, Package, Eye, RotateCcw } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { useQliroListener } from '@/hooks/use-qliro-listener';

interface QliroPayment {
  id: string;
  userId?: string;
  userEmail?: string;
  packageId?: string;
  packageName?: string;
  pricePaid: number;
  paymentMethod: string;
  paymentStatus: string;
  invoiceNumber?: string;
  purchaseDate: string;
  paidAt?: string;
  paymentReference?: string;
  userFirstName?: string;
  userLastName?: string;
}

interface PaymentsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: QliroPayment[];
}

export default function QliroPaymentsClient() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [payments, setPayments] = useState<QliroPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateField, setDateField] = useState<'purchase' | 'paid'>('purchase');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Initialize Qliro listener
  useQliroListener({
    onCompleted: () => {
      toast({
        title: "Betalning slutförd",
        description: "Qliro-betalningen har genomförts framgångsrikt"
      });
      fetchPayments(); // Refresh the list
    },
    onDeclined: () => {
      toast({
        title: "Betalning avbruten", 
        description: "Qliro-betalningen avbröts eller misslyckades",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchPayments();
  }, [user, router, page, search, status, dateField, dateFrom, dateTo]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(status && { status }),
        dateField,
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo })
      });

      const response = await fetch(`/api/admin/qliro/payments?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: PaymentsResponse = await response.json();
      setPayments(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta betalningar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/qliro/payments/${paymentId}/repay`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        // Open in safe embed popup
        const safeUrl = `/payments/qliro/checkout?orderId=${encodeURIComponent(data.checkoutId || paymentId)}`;
        const features = 'width=800,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
        window.open(safeUrl, 'qliro_repay', features);
        
        toast({
          title: "Återbetalningslänk skapad",
          description: "En ny Qliro-checkout har öppnats för återbetalning"
        });
      } else {
        throw new Error('Invalid response from repay endpoint');
      }
    } catch (error) {
      console.error('Repay error:', error);
      toast({
        title: "Återbetalning misslyckades",
        description: error instanceof Error ? error.message : "Kunde inte skapa återbetalningslänk",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Väntande', variant: 'secondary' as const },
      'paid': { label: 'Betald', variant: 'default' as const },
      'failed': { label: 'Misslyckad', variant: 'destructive' as const },
      'cancelled': { label: 'Avbruten', variant: 'outline' as const },
      'refunded': { label: 'Återbetald', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(amount);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtrera betalningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Sök</label>
              <Input
                placeholder="ID, referens, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Alla statusar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alla statusar</SelectItem>
                  <SelectItem value="pending">Väntande</SelectItem>
                  <SelectItem value="paid">Betald</SelectItem>
                  <SelectItem value="failed">Misslyckad</SelectItem>
                  <SelectItem value="cancelled">Avbruten</SelectItem>
                  <SelectItem value="refunded">Återbetald</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Datumtyp</label>
              <Select value={dateField} onValueChange={(v) => setDateField(v as 'purchase' | 'paid')}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Köpdatum</SelectItem>
                  <SelectItem value="paid">Betaldatum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Från datum</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Till datum</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchPayments} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
            <Button 
              onClick={() => {
                setSearch('');
                setStatus('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              variant="outline"
            >
              Rensa filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Qliro Betalningar
          </CardTitle>
          <CardDescription className="text-gray-300">
            Visar {payments.length} av {total} betalningar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Inga betalningar hittades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white font-medium py-3 px-2">ID</th>
                    <th className="text-left text-white font-medium py-3 px-2">Kund</th>
                    <th className="text-left text-white font-medium py-3 px-2">Paket</th>
                    <th className="text-left text-white font-medium py-3 px-2">Belopp</th>
                    <th className="text-left text-white font-medium py-3 px-2">Status</th>
                    <th className="text-left text-white font-medium py-3 px-2">Datum</th>
                    <th className="text-left text-white font-medium py-3 px-2">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2">
                        <div className="text-white text-sm font-mono">
                          {payment.id.slice(0, 8)}...
                        </div>
                        {payment.paymentReference && (
                          <div className="text-gray-400 text-xs">
                            Ref: {payment.paymentReference}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-white text-sm">
                              {payment.userFirstName && payment.userLastName 
                                ? `${payment.userFirstName} ${payment.userLastName}`
                                : 'Gäst'
                              }
                            </div>
                            <div className="text-gray-400 text-xs">
                              {payment.userEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-green-400" />
                          <div className="text-white text-sm">
                            {payment.packageName || 'Okänt paket'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-white font-medium">
                          {formatCurrency(payment.pricePaid)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {getStatusBadge(payment.paymentStatus)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-white text-sm">
                              {formatDate(payment.purchaseDate)}
                            </div>
                            {payment.paidAt && (
                              <div className="text-gray-400 text-xs">
                                Betald: {formatDate(payment.paidAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          {payment.paymentStatus !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRepay(payment.id)}
                              className="text-xs"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Återbetala
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="text-gray-400 text-sm">
                Sida {page} av {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Föregående
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Nästa
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
