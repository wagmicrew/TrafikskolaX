'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Smartphone,
  Coins,
  Building2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Download,
  Eye,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  swishTransactions: number;
  qliroTransactions: number;
  creditTransactions: number;
}

interface PaymentTransaction {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  method: 'swish' | 'qliro' | 'credit' | 'location';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  lessonType?: string;
  scheduledDate?: string;
}

export default function PaymentHubClient() {
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    swishTransactions: 0,
    qliroTransactions: 0,
    creditTransactions: 0
  });
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      // Load payment statistics
      const statsResponse = await fetch('/api/admin/payments/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent transactions
      const transactionsResponse = await fetch('/api/admin/payments/transactions?limit=50');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Kunde inte ladda betalningsdata');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      failed: 'failure',
      cancelled: 'gray'
    };

    const labels = {
      completed: 'Slutförd',
      pending: 'Väntar',
      failed: 'Misslyckad',
      cancelled: 'Avbruten'
    };

    return (
      <Badge color={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const variants = {
      swish: 'green',
      qliro: 'purple',
      credit: 'yellow',
      location: 'blue'
    };

    const labels = {
      swish: 'Swish',
      qliro: 'Qliro',
      credit: 'Krediter',
      location: 'På plats'
    };

    return (
      <Badge color={variants[method as keyof typeof variants] || variants.swish}>
        {labels[method as keyof typeof labels] || method}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedMethod !== 'all' && transaction.method !== selectedMethod) return false;
    if (selectedStatus !== 'all' && transaction.status !== selectedStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-white mx-auto" />
          <p className="text-gray-300">Laddar betalningsdata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Dagens intäkter</p>
                <p className="text-white text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Totala intäkter</p>
                <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Väntande betalningar</p>
                <p className="text-white text-2xl font-bold">{stats.pendingPayments}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Slutförda betalningar</p>
                <p className="text-white text-2xl font-bold">{stats.completedPayments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Betalningsmetoder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white font-bold">Swish</h3>
              <p className="text-green-200 text-2xl font-bold">{stats.swishTransactions}</p>
              <p className="text-green-300 text-sm">transaktioner</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-bold">Qliro</h3>
              <p className="text-purple-200 text-2xl font-bold">{stats.qliroTransactions}</p>
              <p className="text-purple-300 text-sm">transaktioner</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Coins className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-bold">Krediter</h3>
              <p className="text-blue-200 text-2xl font-bold">{stats.creditTransactions}</p>
              <p className="text-blue-300 text-sm">transaktioner</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Management */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Senaste transaktioner
            </CardTitle>
            <div className="flex items-center gap-4">
              <Button
                onClick={loadPaymentData}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Uppdatera
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportera
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="all">Alla metoder</option>
                <option value="swish">Swish</option>
                <option value="qliro">Qliro</option>
                <option value="credit">Krediter</option>
                <option value="location">På plats</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="all">Alla statusar</option>
                <option value="pending">Väntar</option>
                <option value="completed">Slutförd</option>
                <option value="failed">Misslyckad</option>
                <option value="cancelled">Avbruten</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Faktura</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Kund</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Belopp</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Metod</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Datum</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-white font-medium">{transaction.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{transaction.customerName}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(transaction.amount)}</td>
                    <td className="py-3 px-4">{getMethodBadge(transaction.method)}</td>
                    <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(transaction.createdAt).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">Inga transaktioner hittades</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
