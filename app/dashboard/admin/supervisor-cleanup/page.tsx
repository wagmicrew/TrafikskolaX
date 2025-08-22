'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  Eye, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ExpiredBooking {
  bookingId: string;
  sessionDate: string;
  sessionTime: string;
  supervisors: {
    name: string;
    hasPersonalNumber: boolean;
  }[];
}

interface CleanupStats {
  totalExpiredBookings: number;
  totalPersonalNumbersToClean: number;
  expiredBookings: ExpiredBooking[];
}

export default function SupervisorCleanupPage() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadLastCleanup();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/cleanup-supervisor-data');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('Failed to load cleanup statistics');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error loading cleanup statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadLastCleanup = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const value = data?.settings?.last_supervisor_cleanup as string | undefined;
        if (value) setLastCleanup(value);
      }
    } catch (error) {
      console.error('Error loading last cleanup:', error);
    }
  };

  const runCleanup = async () => {
    if (!confirm('Are you sure you want to clean up personal numbers for expired bookings? This action cannot be undone.')) {
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await fetch('/api/admin/cleanup-supervisor-data', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully cleaned ${result.cleanedCount} personal numbers`);
        loadStats();
        loadLastCleanup();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to run cleanup');
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast.error('Error running cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sv-SE');
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Supervisor Data Cleanup</h1>
        <p className="text-gray-600">
          Manage and clean up personal numbers for supervisors in expired handledar bookings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Bookings</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : (stats?.totalExpiredBookings ?? 0)}
            </div>
            <p className="text-xs text-gray-600">
              Bookings with passed session dates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Numbers</CardTitle>
            <Shield className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : (stats?.totalPersonalNumbersToClean ?? 0)}
            </div>
            <p className="text-xs text-gray-600">
              Personal numbers to be cleaned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Cleanup</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastCleanup ? formatDate(lastCleanup) : 'Never'}
            </div>
            <p className="text-xs text-gray-600">
              Last automatic cleanup
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          onClick={loadStats}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          onClick={runCleanup}
          disabled={cleanupLoading || !stats?.totalPersonalNumbersToClean}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
          {cleanupLoading ? 'Cleaning...' : 'Run Cleanup'}
        </Button>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> This tool automatically erases personal numbers for supervisors 
          in bookings that have passed their session date. Personal numbers are encrypted with bcrypt 
          and automatically deleted after lessons are completed to comply with GDPR requirements.
        </AlertDescription>
      </Alert>

      {stats?.expiredBookings && stats.expiredBookings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Expired Bookings ({stats.expiredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.expiredBookings.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Booking {booking.bookingId}</span>
                      <Badge variant="secondary">
                        {formatDate(booking.sessionDate)} {formatTime(booking.sessionTime)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {booking.supervisors.map((supervisor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span>• {supervisor.name}</span>
                        {supervisor.hasPersonalNumber && (
                          <Badge variant="destructive" className="text-xs">
                            Has Personal Number
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Expired Bookings</h3>
            <p className="text-gray-600">
              All handledar bookings are current or have already been cleaned up.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
