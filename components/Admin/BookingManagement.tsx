import React, { useEffect, useState, useCallback, memo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import fetcher from '@/lib/fetcher';

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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Booking Management</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Lesson</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.id}</td>
              <td>{booking.userName || booking.userEmail}</td>
              <td>{booking.lessonTypeName}</td>
              <td>{new Date(booking.scheduledDate).toLocaleDateString()}</td>
              <td>{booking.scheduledTime}</td>
              <td>
                <select 
                  value={booking.status} 
                  onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                >
                  <option value="on_hold">On Hold</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td>
                <select 
                  value={booking.paymentStatus} 
                  onChange={(e) => handleUpdatePaymentStatus(booking.id, e.target.value)}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </td>
              <td>{booking.totalPrice} kr</td>
              <td>
                <button onClick={() => handleDeleteBooking(booking.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

BookingManagement.displayName = 'BookingManagement';

export default BookingManagement;
