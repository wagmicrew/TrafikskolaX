'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ViewToggle } from '@/components/admin/view-toggle';
import { BookingsTable } from '@/components/admin/bookings-table';
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
  Loader2,
  MoreHorizontal,
  Search,
  Filter
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Alert,
  Select,
  TextInput
} from 'flowbite-react';
import { HiOutlineExclamation, HiOutlineEye, HiOutlineTrash, HiOutlineBan } from 'react-icons/hi';

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
  const [view, setView] = useState<'cards' | 'table'>('cards');
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
      t.update({ title: 'Temporära bokningar rensade', id: t.id });
      setTimeout(() => t.dismiss(), 1200);
      // Refresh current view
      router.refresh?.();
      window.location.reload();
    } catch (e: any) {
      t.update({ title: 'Fel vid rensning', description: e.message || 'Misslyckades', variant: 'destructive', id: t.id });
      setTimeout(() => t.dismiss(), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveCancelled = async () => {
    setIsProcessing(true);
    const t = toast({ title: 'Arkiverar avbrutna bokningar...' });
    try {
      const res = await fetch('/api/admin/bookings/archive-cancelled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: 15 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Arkivering misslyckades');
      t.update({ title: 'Klart', description: `Arkiverade ${data.archived} avbrutna bokningar`, id: t.id });
      setTimeout(() => t.dismiss(), 1200);
      router.refresh?.();
      window.location.reload();
    } catch (e: any) {
      t.update({ title: 'Fel vid arkivering', description: e.message || 'Misslyckades', variant: 'destructive', id: t.id });
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
      setConfirmAction(null);
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
        console.error('Error unbooking:', error);
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
      setConfirmAction(null);
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
        console.error('Error deleting:', error);
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
      setConfirmAction(null);
      setIsProcessing(true);
      
      try {
        const response = await fetch('/api/admin/bookings/remove-teacher', {
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
      setConfirmAction(null);
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
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
    }
  };

  const getPaymentIcon = (paymentStatus: string | null) => {
    switch (paymentStatus) {
      case 'paid':
        return <CreditCard className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <CreditCard className="w-5 h-5 text-amber-400" />;
      case 'refunded':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-rose-400" />;
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {warning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <HiOutlineExclamation className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bekräfta åtgärd
              </h3>
            </div>
            <div className="p-6">
              <p className="text-base text-gray-500 dark:text-gray-300 mb-4">
                {warning}
              </p>
              <Alert color="warning">
                <span className="font-medium">Varning!</span> Denna åtgärd kan inte ångras.
              </Alert>
            </div>
            <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 gap-2">
              <Button
                color="gray"
                onClick={() => { setWarning(null); setConfirmAction(null); }}
              >
                Avbryt
              </Button>
              <Button
                color="red"
                onClick={() => confirmAction && confirmAction()}
              >
                Fortsätt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section with Flowbite Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Header Card */}
        <Card className="lg:col-span-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Bokningar
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Hantera alla bokningar och scheman
                </p>
              </div>
            </div>
            <Badge color="info" className="text-sm">
              {bookings.length} bokningar
            </Badge>
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card className="shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Snabbåtgärder
          </h3>
          <div className="space-y-2">
            <Button
              size="sm"
              color="light"
              onClick={handleClearTemp}
              disabled={isProcessing}
              className="w-full justify-start"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Rensa temporära
            </Button>
            <Button
              size="sm"
              color="light"
              onClick={handleArchiveCancelled}
              disabled={isProcessing}
              className="w-full justify-start"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              Arkivera avbrutna
            </Button>
          </div>
        </Card>
      </div>

      {/* Filters Section with Flowbite Components */}
      <Card className="shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="w-full sm:w-64">
              <Select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                icon={User}
              >
                <option value="">Alla användare</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Toggle Past/Future Bookings */}
      <Card className="shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Visa: {showPast ? 'Alla bokningar' : 'Endast framtida bokningar'}
            </span>
          </div>
          <Button
            size="sm"
            color={showPast ? "blue" : "light"}
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
          >
            <Calendar className="w-4 h-4 mr-2" />
            {showPast ? 'Visa framtida' : 'Visa alla'}
          </Button>
        </div>
      </Card>

      {/* View Toggle */}
      <ViewToggle view={view} onViewChange={setView} />

      {/* Bulk Actions with Flowbite Alert */}
      {selectedBookings.length > 0 && (
        <Alert color="info" className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="font-semibold text-blue-800 dark:text-blue-200">
                  {selectedBookings.length} bokning{selectedBookings.length !== 1 ? 'ar' : ''} vald{selectedBookings.length !== 1 ? 'a' : ''}
                </span>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Välj åtgärd för de valda bokningarna
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                color="warning"
                onClick={handleBulkUnbook}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4 mr-2" />
                )}
                Avboka ({selectedBookings.length})
              </Button>

              <Button
                size="sm"
                color="red"
                onClick={handleBulkDelete}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Ta bort ({selectedBookings.length})
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Card className="shadow-lg">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Inga bokningar hittades
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Det finns för närvarande inga bokningar att visa.
            </p>
          </div>
        </Card>
      ) : view === 'cards' ? (
        <>
          {/* Bookings Cards View - Placeholder for now */}
          <Card className="shadow-lg">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Kommer snart: Kortvy för bokningar
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Kortvyn för bokningar är under utveckling.
              </p>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Bookings Table View */}
          <Card className="shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="p-4">
                      <div className="flex items-center">
                        <input
                          id="checkbox-all"
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          checked={selectedBookings.length === bookings.length && bookings.length > 0}
                          onChange={handleSelectAll}
                        />
                        <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">Datum & Tid</th>
                    <th scope="col" className="px-6 py-3">Kund</th>
                    <th scope="col" className="px-6 py-3">Lektionstyp</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Betalning</th>
                    <th scope="col" className="px-6 py-3">Pris</th>
                    <th scope="col" className="px-6 py-3">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedBookings.includes(booking.id)}
                            onChange={() => handleBookingSelection(booking.id)}
                          />
                          <label className="sr-only">checkbox</label>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString('sv-SE')}</span>
                          <span className="text-xs">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{booking.userName}</span>
                          <span className="text-xs">{booking.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{booking.lessonTypeName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {booking.status === 'confirmed' ? 'Bekräftad' :
                           booking.status === 'cancelled' ? 'Avbruten' :
                           booking.status === 'completed' ? 'Genomförd' : 'Väntar'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {booking.paymentStatus === 'paid' ? 'Betald' :
                           booking.paymentStatus === 'pending' ? 'Väntar' :
                           booking.paymentStatus === 'refunded' ? 'Återbetald' : 'Obetald'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{booking.totalPrice} kr</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/admin/bookings/${booking.id}`}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 inline-block"
                            title="Visa detaljer"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                            title="Ta bort"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                color="light"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Föregående
              </Button>
              
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Sida {currentPage} av {totalPages}
              </span>
              
              <Button
                size="sm"
                color="light"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Nästa
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}