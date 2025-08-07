'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Ban,
  Users,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react';

interface Booking {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  transmissionType: string | null;
  status: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  totalPrice: string;
  isCompleted: boolean | null;
  isGuestBooking: boolean | null;
  createdAt: Date;
  userName: string;
  userEmail: string;
  userPhone: string;
  userId: string | null;
  lessonTypeName: string;
  teacherId?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface BookingsClientProps {
  bookings: Booking[];
  users: User[];
  currentPage: number;
  totalPages: number;
  selectedUserId: string;
  showPast: boolean;
}

export default function BookingsClient({
  bookings,
  users,
  currentPage,
  totalPages,
  selectedUserId,
  showPast,
}: BookingsClientProps) {
  const router = useRouter();
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleUserChange = (userId: string) => {
    const params = new URLSearchParams(window.location.search);
    if (userId) params.set('user', userId);
    else params.delete('user');
    params.set('page', '1');
    router.push(`/dashboard/admin/bookings?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.push(`/dashboard/admin/bookings?${params.toString()}`);
  };

  const handleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map(booking => booking.id));
    }
  };

  const handleBulkUnbook = async () => {
    if (selectedBookings.length === 0) {
      toast.error('Välj bokningar att avboka');
      return;
    }

    if (!confirm(`Är du säker på att du vill avboka ${selectedBookings.length} bokningar? Detta kommer att skicka e-post och återbetala krediter.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/bookings/bulk-unbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: selectedBookings })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setSelectedBookings([]);
        router.refresh();
      } else {
        toast.error(result.error || 'Fel vid avbokning');
      }
    } catch (error) {
      console.error('Error bulk unbooking:', error);
      toast.error('Fel vid avbokning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) {
      toast.error('Välj bokningar att ta bort');
      return;
    }

    if (!confirm(`Är du säker på att du vill ta bort ${selectedBookings.length} bokningar permanent? Detta går inte att ångra.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/bookings/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: selectedBookings })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setSelectedBookings([]);
        router.refresh();
      } else {
        toast.error(result.error || 'Fel vid borttagning');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Fel vid borttagning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna lärare? Detta kommer att avregistrera läraren från alla bokningar och ta bort användarkontot permanent.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/teachers/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Lärare borttagen framgångsrikt');
        router.refresh();
      } else {
        toast.error(result.error || 'Fel vid borttagning av lärare');
      }
    } catch (error) {
      console.error('Error removing teacher:', error);
      toast.error('Fel vid borttagning av lärare');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPaymentIcon = (paymentStatus: string) => {
    return paymentStatus === 'paid' ? (
      <CreditCard className="w-5 h-5 text-green-500" />
    ) : (
      <CreditCard className="w-5 h-5 text-gray-400" />
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          Bokningar
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
          >
            <option value="">Alla användare</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
            </select>
            
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                if (showPast) {
                  params.delete('showPast');
                } else {
                  params.set('showPast', 'true');
                }
                params.set('page', '1');
                router.push(`/dashboard/admin/bookings?${params.toString()}`);
              }}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                showPast 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {showPast ? 'Visa endast framtida' : 'Visa alla bokningar'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {selectedBookings.length} bokning{selectedBookings.length !== 1 ? 'ar' : ''} vald{selectedBookings.length !== 1 ? 'a' : ''}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleBulkUnbook}
                disabled={isProcessing}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                Avboka ({selectedBookings.length})
              </button>
              
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Ta bort ({selectedBookings.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Inga bokningar hittades</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2"></div>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => handleBookingSelection(booking.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <User className="w-5 h-5 text-gray-600" />
                        <h3 className="text-xl font-semibold text-gray-800">
                          {booking.userName}
                        </h3>
                        {getStatusIcon(booking.status)}
                        {getPaymentIcon(booking.paymentStatus)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.scheduledDate).toLocaleDateString('sv-SE')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Car className="w-4 h-4" />
                          <span>{booking.lessonTypeName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{booking.userEmail}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{booking.userPhone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-xs">
                            Skapad: {new Date(booking.createdAt).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 shadow-md"
                      >
                        <Eye className="w-5 h-5" />
                        Öppna
                      </Link>
                      
                      {booking.teacherId && (
                        <button
                          onClick={() => handleRemoveTeacher(booking.teacherId!)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                          title="Ta bort lärare från bokningen"
                        >
                          <Users className="w-4 h-4" />
                          Ta bort lärare
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Select All Button */}
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {selectedBookings.length === bookings.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedBookings.length === bookings.length ? 'Avmarkera alla' : 'Markera alla'}
            </button>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
