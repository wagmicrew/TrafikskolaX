'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

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

  const handleClearTemp = async () => {
    setIsProcessing(true);
    const t = toast({ title: 'Rensar temporära bokningar...' });
    try {
      const res = await fetch('/api/dashboard/admin/qliro/order-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearTemp', payload: {} })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rensning misslyckades');
      t.update({ title: 'Temporära bokningar rensade' });
      setTimeout(() => t.dismiss(), 1200);
      // Refresh current view
      router.refresh?.();
      window.location.reload();
    } catch (e: any) {
      t.update({ title: 'Fel vid rensning', description: e.message || 'Misslyckades', variant: 'destructive' });
      setTimeout(() => t.dismiss(), 2000);
    } finally {
      setIsProcessing(false);
    }
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
      toast({ title: 'Fel', description: 'Välj bokningar att avboka', variant: 'destructive' });
      return;
    }
    setWarning(`Är du säker på att du vill avboka ${selectedBookings.length} bokningar? Detta skickar e-post och återbetalar krediter.`);
    setConfirmAction(() => async () => {
      setWarning(null);
      setIsProcessing(true);
      try {
        const response = await fetch('/api/admin/bookings/bulk-unbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingIds: selectedBookings })
        });
        const result = await response.json();
        if (response.ok) {
          toast({ title: 'Klart', description: result.message, variant: 'default' });
          setSelectedBookings([]);
          router.refresh();
        } else {
          toast({ title: 'Fel', description: result.error || 'Fel vid avbokning', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error bulk unbooking:', error);
        toast({ title: 'Fel', description: 'Fel vid avbokning', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) {
      toast({ title: 'Fel', description: 'Välj bokningar att ta bort', variant: 'destructive' });
      return;
    }
    setWarning(`Ta bort ${selectedBookings.length} bokningar permanent? Detta går inte att ångra.`);
    setConfirmAction(() => async () => {
      setWarning(null);
      setIsProcessing(true);
      try {
        const response = await fetch('/api/admin/bookings/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingIds: selectedBookings })
        });
        const result = await response.json();
        if (response.ok) {
          toast({ title: 'Klart', description: result.message, variant: 'default' });
          setSelectedBookings([]);
          router.refresh();
        } else {
          toast({ title: 'Fel', description: result.error || 'Fel vid borttagning', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error bulk deleting:', error);
        toast({ title: 'Fel', description: 'Fel vid borttagning', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    setWarning('Ta bort denna lärare permanent och avregistrera från alla bokningar?');
    setConfirmAction(() => async () => {
      setWarning(null);
      setIsProcessing(true);
      try {
        const response = await fetch('/api/admin/teachers/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacherId })
        });
        const result = await response.json();
        if (response.ok) {
          toast({ title: 'Klart', description: 'Lärare borttagen', variant: 'default' });
          router.refresh();
        } else {
          toast({ title: 'Fel', description: result.error || 'Fel vid borttagning av lärare', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error removing teacher:', error);
        toast({ title: 'Fel', description: 'Fel vid borttagning av lärare', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handleDeleteBooking = async (bookingId: string) => {
    setWarning('Ta bort denna bokning permanent? Detta går inte att ångra.');
    setConfirmAction(() => async () => {
      setWarning(null);
      setIsProcessing(true);
      try {
        const response = await fetch('/api/admin/bookings/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingIds: [bookingId] })
        });
        const result = await response.json();
        if (response.ok) {
          toast({ title: 'Klart', description: 'Bokning borttagen', variant: 'default' });
          router.refresh();
        } else {
          toast({ title: 'Fel', description: result.error || 'Fel vid borttagning av bokning', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        toast({ title: 'Fel', description: 'Fel vid borttagning av bokning', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPaymentIcon = (paymentStatus: string | null) => {
    if (!paymentStatus) return <CreditCard className="w-5 h-5 text-gray-400" />;
    
    return paymentStatus.toLowerCase() === 'paid' ? (
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
    <div className="text-slate-100">
      {/* Glass warning dialog */}
      {warning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Bekräfta</h3>
            </div>
            <p className="text-slate-300 mb-6">{warning}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setWarning(null); setConfirmAction(null); }} className="px-4 py-2 rounded-lg text-white border border-white/20 hover:bg-white/10">Avbryt</button>
              <button onClick={() => confirmAction && confirmAction()} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">Fortsätt</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
          <Calendar className="w-8 h-8 text-sky-300" />
          Bokningar
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <select
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            onClick={handleClearTemp}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 border bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-50`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rensar...
              </>
            ) : (
              <>Rensa temporära bokningar</>
            )}
          </button>

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
              className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 border ${
                showPast 
                  ? 'bg-white/20 text-white border-white/30 hover:bg-white/30' 
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {showPast ? 'Visa endast framtida' : 'Visa alla bokningar'}
            </button>
          </div>
        </div>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 ? (
        <div className="mb-6 p-4 rounded-xl bg-white/10 border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-sky-300" />
              <span className="font-medium text-white">
                {selectedBookings.length} bokning{selectedBookings.length !== 1 ? 'ar' : ''} vald{selectedBookings.length !== 1 ? 'a' : ''}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleBulkUnbook}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-amber-500/80 hover:bg-amber-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg"
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
                className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg"
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
      ) : null}

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-slate-300">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-lg">Inga bokningar hittades</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/15 transition-colors duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => handleBookingSelection(booking.id)}
                          className="w-4 h-4 bg-white/10 border-white/30 rounded focus:ring-sky-500"
                        />
                        <User className="w-5 h-5 text-slate-200" />
                        <h3 className="text-xl font-semibold text-white">
                          {booking.userName}
                        </h3>
                        {getStatusIcon(booking.status)}
                        {getPaymentIcon(booking.paymentStatus)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.scheduledDate).toLocaleDateString('sv-SE')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-300">
                          <Car className="w-4 h-4" />
                          <span>{booking.lessonTypeName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{booking.userEmail}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone className="w-4 h-4" />
                          <span>{booking.userPhone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-xs">
                            Skapad: {new Date(booking.createdAt).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors duration-200"
                      >
                        <Eye className="w-5 h-5" />
                        Öppna
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white disabled:opacity-50 transition-colors duration-200 shadow-lg"
                        title="Ta bort bokning permanent"
                      >
                        <Trash2 className="w-4 h-4" />
                        Ta bort
                      </button>
                      
                      {booking.teacherId && (
                        <button
                          onClick={() => handleRemoveTeacher(booking.teacherId!)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors duration-200 shadow-lg"
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
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
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className={`px-4 py-2 rounded-xl transition-colors border ${
                      currentPage === pageNum
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-white/10 hover:bg-white/20 border-white/20'
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
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
