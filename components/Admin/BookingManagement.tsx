"use client";

import React, { useEffect, useState, useCallback, memo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import fetcher from '@/lib/fetcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrbSpinner } from '@/components/ui/orb-loader';
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from '@/components/ui/select';

const BookingManagement: React.FC = memo(() => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user || !user.role || user.role !== 'admin') return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetcher('/api/admin/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookings(response || []);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
       setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await fetcher(`/api/admin/bookings`, {
        method: 'PUT',
        body: JSON.stringify({ id: bookingId, status }),
      });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (error) {
      console.error('Error updating booking status', error);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: string, paymentStatus: string) => {
    try {
      await fetcher(`/api/admin/bookings`, {
        method: 'PUT',
        body: JSON.stringify({ id: bookingId, paymentStatus }),
      });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paymentStatus } : b));
    } catch (error) {
      console.error('Error updating payment status', error);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await fetcher(`/api/admin/bookings?id=${bookingId}`, {
        method: 'DELETE',
      });
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error) {
      console.error('Error deleting booking', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <OrbSpinner size="md" />
    </div>
  );

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">Bokningshantering</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Användare</TableHead>
              <TableHead>Lektion</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Tid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Betalning</TableHead>
              <TableHead>Pris</TableHead>
              <TableHead>Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                <TableCell>{booking.userName || booking.userEmail}</TableCell>
                <TableCell>{booking.lessonTypeName}</TableCell>
                <TableCell>{new Date(booking.scheduledDate).toLocaleDateString()}</TableCell>
                <TableCell>{booking.scheduledTime}</TableCell>
                <TableCell>
                  <Select value={booking.status} onValueChange={(v) => handleUpdateStatus(booking.id, v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Välj status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_hold">Väntande</SelectItem>
                      <SelectItem value="confirmed">Bekräftad</SelectItem>
                      <SelectItem value="cancelled">Avbokad</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={booking.paymentStatus} onValueChange={(v) => handleUpdatePaymentStatus(booking.id, v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Obetald</SelectItem>
                      <SelectItem value="paid">Betald</SelectItem>
                      <SelectItem value="refunded">Återbetald</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{booking.totalPrice} kr</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteBooking(booking.id)}>
                    Ta bort
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});

BookingManagement.displayName = 'BookingManagement';

export default BookingManagement;
