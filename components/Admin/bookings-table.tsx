'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Badge,
  Checkbox
} from 'flowbite-react';
import {
  Calendar,
  Clock,
  User,
  Car,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  CreditCard,
  AlertCircle,
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
  totalPrice: number;
  notes: string | null;
  userId: string | null;
  teacherId: string | null;
  lessonTypeId: string;
  carId: string | null;
  isGuestBooking: boolean;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  teacher?: {
    firstName: string;
    lastName: string;
  } | null;
  lessonType?: {
    name: string;
  } | null;
  car?: {
    name: string;
  } | null;
}

interface BookingsTableProps {
  bookings: Booking[];
  selectedBookings: string[];
  onSelectBooking: (bookingId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewBooking: (bookingId: string) => void;
  onDeleteBooking: (bookingId: string) => void;
  onToggleStatus: (bookingId: string, status: string) => void;
}

export function BookingsTable({
  bookings,
  selectedBookings,
  onSelectBooking,
  onSelectAll,
  onViewBooking,
  onDeleteBooking,
  onToggleStatus
}: BookingsTableProps) {
  const allSelected = bookings.length > 0 && selectedBookings.length === bookings.length;
  const someSelected = selectedBookings.length > 0 && selectedBookings.length < bookings.length;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return <Badge color="success" className="text-xs">Bekräftad</Badge>;
      case 'temp':
        return <Badge color="warning" className="text-xs">Tillfällig</Badge>;
      case 'cancelled':
        return <Badge color="failure" className="text-xs">Avbokad</Badge>;
      case 'completed':
        return <Badge color="info" className="text-xs">Slutförd</Badge>;
      default:
        return <Badge color="light" className="text-xs">Okänd</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string | null) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge color="success" className="text-xs">Betald</Badge>;
      case 'unpaid':
        return <Badge color="warning" className="text-xs">Obetald</Badge>;
      case 'pending':
        return <Badge color="light" className="text-xs">Väntar</Badge>;
      case 'failed':
        return <Badge color="failure" className="text-xs">Misslyckad</Badge>;
      default:
        return <Badge color="light" className="text-xs">-</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sv-SE');
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // HH:MM format
  };

  return (
    <div className="overflow-x-auto">
      <Table hoverable>
        <TableHead>
          <TableRow>
            <TableHeadCell className="p-4">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </TableHeadCell>
            <TableHeadCell>Datum & Tid</TableHeadCell>
            <TableHeadCell>Kund</TableHeadCell>
            <TableHeadCell>Lektionstyp</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Betalning</TableHeadCell>
            <TableHeadCell>Pris</TableHeadCell>
            <TableHeadCell>Åtgärder</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className="divide-y">
          {bookings.map((booking) => (
            <TableRow key={booking.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableCell className="p-4">
                <Checkbox
                  checked={selectedBookings.includes(booking.id)}
                  onChange={(e) => onSelectBooking(booking.id, e.target.checked)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(booking.scheduledDate)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    <span className="text-xs">({booking.durationMinutes}min)</span>
                  </div>
                  {booking.transmissionType && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Car className="w-3 h-3" />
                      {booking.transmissionType === 'automatic' ? 'Automat' : 'Manuell'}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {booking.isGuestBooking ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                      <User className="w-4 h-4 text-gray-400" />
                      {booking.guestName || 'Gäst'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.guestEmail}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                      <User className="w-4 h-4 text-gray-400" />
                      {booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Okänd användare'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.user?.email}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white">
                    {booking.lessonType?.name || 'Okänd typ'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(booking.status)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getPaymentStatusBadge(booking.paymentStatus)}
                  {booking.paymentMethod && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {booking.paymentMethod}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium text-gray-900 dark:text-white">
                {booking.totalPrice} kr
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    size="xs"
                    color="light"
                    onClick={() => onViewBooking(booking.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Visa
                  </Button>
                  <Button
                    size="xs"
                    color="warning"
                    onClick={() => onToggleStatus(booking.id, booking.status === 'confirmed' ? 'temp' : 'confirmed')}
                    className="flex items-center gap-1"
                  >
                    {booking.status === 'confirmed' ? (
                      <>
                        <Ban className="w-3 h-3" />
                        Avbryt
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Bekräfta
                      </>
                    )}
                  </Button>
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => onDeleteBooking(booking.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Ta bort
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
