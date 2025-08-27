"use client";

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Printer,
  CreditCard,
  CheckCircle2,
  MailCheck,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  User,
  MapPin,
  Phone,
  FileText,
  Receipt,
  ArrowLeft,
  Check,
  X,
  Bell,
  User as UserIcon,
  Car,
  CreditCard as CreditCardIcon,
  FileText as FileIcon,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Booking = {
  id: string;
  userId?: string | null;
  lessonTypeId?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  transmissionType?: string | null;
  status: string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  swishUUID?: string | null;
  teacherId?: string | null;
  isGuestBooking: boolean;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  notes?: string | null;
  totalPrice: number;
};

type LessonType = {
  id: string;
  name: string;
  type: 'lesson' | 'handledar' | 'teori';
  description?: string | null;
  durationMinutes: number;
  price: number;
};

type UserDetails = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
  customerNumber?: string | null;
  isActive: boolean;
  personalNumber?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  licenseNumber?: string | null;
};

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  licenseNumber?: string | null;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate?: Date | null;
  createdAt: Date;
} | null;

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  itemType: string;
  itemReference?: string | null;
};

type Settings = {
  schoolName: string;
  schoolPhone?: string;
  swishNumber?: string;
  schoolAddress?: string;
  mapsEmbedUrl?: string;
};

export default function AdminBookingDetailsClient({
  booking,
  lessonType,
  user,
  teacher,
  invoice,
  invoiceItems,
  settings
}: {
  booking: Booking;
  lessonType: LessonType | null;
  user: UserDetails | null;
  teacher: Teacher | null;
  invoice: Invoice;
  invoiceItems: InvoiceItem[];
  settings: Settings;
}) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const amount = useMemo(() => Number(booking.totalPrice || 0), [booking.totalPrice]);
  const sessionDate = useMemo(() => format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv }), [booking.scheduledDate]);

  // Get customer info
  const customerName = booking.isGuestBooking
    ? booking.guestName
    : (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Okänd kund');
  const customerEmail = booking.isGuestBooking ? booking.guestEmail : (user?.email || '');
  const customerPhone = booking.isGuestBooking ? booking.guestPhone : (user?.phone || '');

  // Admin actions
  const confirmSwishPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/admin/booking/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm payment');
      }

      toast.success('Betalning bekräftad!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Ett fel uppstod vid bekräftelse');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const sendPaymentReminder = async () => {
    setIsSendingReminder(true);
    try {
      const response = await fetch('/api/admin/booking/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reminder');
      }

      toast.success('Påminnelse skickad till kund!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Ett fel uppstod när påminnelse skulle skickas');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const declineOrder = async () => {
    if (!confirm('Är du säker på att du vill neka denna order? Detta kommer att släppa tiden och skicka ett mail till kunden.')) {
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/admin/booking/decline-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decline order');
      }

      toast.success('Order nekad och tid släppt');
      setTimeout(() => {
        window.location.href = '/dashboard/admin/bookings';
      }, 1000);
    } catch (error) {
      console.error('Error declining order:', error);
      toast.error('Ett fel uppstod när order skulle nekas');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const markBookingComplete = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/admin/booking/mark-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as complete');
      }

      toast.success('Bokning markerad som genomförd!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error marking as complete:', error);
      toast.error('Ett fel uppstod');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin/bookings"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till bokningar
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bokningsdetaljer
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Bokning #{booking.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {booking.status === 'confirmed' ? 'Bekräftad' :
                 booking.status === 'completed' ? 'Genomförd' :
                 booking.status === 'cancelled' ? 'Inställd' :
                 'Väntar'}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                booking.paymentStatus === 'unpaid' ? 'bg-red-100 text-red-800' :
                booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {booking.paymentStatus === 'paid' ? 'Betald' :
                 booking.paymentStatus === 'unpaid' ? 'Obetald' :
                 booking.paymentStatus === 'pending' ? 'Väntar' :
                 booking.paymentStatus || 'Okänd'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Booking Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Bokningsinformation
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{sessionDate}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.startTime} - {booking.endTime} ({booking.durationMinutes} min)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{lessonType?.name || 'Okänd lektionstyp'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.transmissionType === 'automatic' ? 'Automat' : 'Manuell'} växlade
                      </p>
                    </div>
                  </div>

                  {teacher && (
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {teacher.email} {teacher.phone && `• ${teacher.phone}`}
                        </p>
                        {teacher.licenseNumber && (
                          <p className="text-xs text-gray-500">Licens: {teacher.licenseNumber}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{amount} kr</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Betalningsmetod: {booking.paymentMethod || 'Ej vald'}
                      </p>
                      {booking.swishUUID && (
                        <p className="text-xs text-gray-500">Swish UUID: {booking.swishUUID}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Skapad</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm', { locale: sv })}
                      </p>
                      <p className="text-xs text-gray-500">Senast uppdaterad: {format(new Date(booking.updatedAt), 'yyyy-MM-dd HH:mm', { locale: sv })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Anteckningar</h4>
                  <p className="text-gray-700 dark:text-gray-300">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Kundinformation
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{customerName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.isGuestBooking ? 'Gästbokning' : 'Registrerad användare'}
                    </p>
                  </div>
                </div>

                {customerEmail && (
                  <div className="flex items-center gap-3">
                    <MailCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{customerEmail}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">E-postadress</p>
                    </div>
                  </div>
                )}

                {customerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{customerPhone}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Telefonnummer</p>
                    </div>
                  </div>
                )}

                {user && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Kundnummer</h4>
                      <p className="text-gray-600 dark:text-gray-400">{user.customerNumber || 'Saknas'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    {user.personalNumber && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Personnummer</h4>
                        <p className="text-gray-600 dark:text-gray-400">{user.personalNumber}</p>
                      </div>
                    )}
                    {user.licenseNumber && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Körkortnummer</h4>
                        <p className="text-gray-600 dark:text-gray-400">{user.licenseNumber}</p>
                      </div>
                    )}
                    {user.address && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Adress</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {user.address}{user.postalCode && `, ${user.postalCode}`} {user.city && user.city}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Information */}
          {invoice && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Fakturainformation
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Faktura #{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Skapad: {format(new Date(invoice.createdAt), 'yyyy-MM-dd', { locale: sv })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{invoice.amount} kr</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Betald' :
                           invoice.status === 'pending' ? 'Väntar' :
                           invoice.status === 'overdue' ? 'Förfallen' :
                           invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {invoice.dueDate && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Förfallodatum</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(invoice.dueDate), 'yyyy-MM-dd', { locale: sv })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {invoiceItems.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Fakturarader</h4>
                    <div className="space-y-2">
                      {invoiceItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.quantity}x {item.unitPrice} kr
                            </p>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{item.amount} kr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Administratörskontroller
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Hantera betalning, påminnelser och bokningsstatus
              </p>

              {/* Flowbite Button Group */}
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  onClick={confirmSwishPayment}
                  disabled={isProcessingPayment || booking.paymentStatus === 'paid'}
                  className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg focus:z-10 focus:ring-2 focus:ring-green-700 focus:text-green-700 ${
                    booking.paymentStatus === 'paid' ? 'text-gray-400 bg-gray-100 cursor-not-allowed' :
                    'text-green-700 bg-white hover:bg-gray-100 hover:text-green-800'
                  } dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600`}
                >
                  <Check className="w-4 h-4 mr-1 inline" />
                  Bekräfta betalning
                </button>
                <button
                  onClick={sendPaymentReminder}
                  disabled={isSendingReminder || booking.paymentStatus === 'paid'}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600"
                >
                  <Bell className="w-4 h-4 mr-1 inline" />
                  {isSendingReminder ? 'Skickar...' : 'Påminn kund'}
                </button>
                <button
                  onClick={markBookingComplete}
                  disabled={isProcessingPayment || booking.status === 'completed'}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-purple-700 focus:z-10 focus:ring-2 focus:ring-purple-700 focus:text-purple-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1 inline" />
                  Markera genomförd
                </button>
                <button
                  onClick={declineOrder}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-100 hover:text-red-800 focus:z-10 focus:ring-2 focus:ring-red-700 focus:text-red-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600"
                >
                  <X className="w-4 h-4 mr-1 inline" />
                  Neka order
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tips:</strong> Bekräfta betalning endast efter att du har verifierat att pengarna har kommit in. Neka order tar bort bokningen och släpper tiden.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="mt-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
            {settings.schoolPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Frågor? Ring {settings.schoolPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Boknings-ID: {booking.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
