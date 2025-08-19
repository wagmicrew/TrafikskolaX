

import { db } from '@/lib/db';
import { bookings, users, cars, lessonTypes } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
  FileText,
  MapPin,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

import BookingDetailsClient from './BookingDetailsClient';

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;

    // Fetch booking details with related information
    const booking = await db
      .select({
        id: bookings.id,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        lessonTypeId: bookings.lessonTypeId,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        isCompleted: bookings.isCompleted,
        completedAt: bookings.completedAt,
        notes: bookings.notes,
        invoiceNumber: bookings.invoiceNumber,
        invoiceDate: bookings.invoiceDate,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        totalPrice: bookings.totalPrice,
        userId: bookings.userId,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        guestPhone: bookings.guestPhone,
        carId: bookings.carId,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhone: users.phone,
        carName: cars.name,
        carRegistration: cars.licensePlate,
        lessonTypeName: lessonTypes.name,
        lessonTypePrice: lessonTypes.price,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(cars, eq(bookings.carId, cars.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking || booking.length === 0) {
      notFound();
    }

    const bookingData = booking[0];

    if (!bookingData) {
      notFound();
    }

return (
      <>
        <BookingDetailsClient booking={bookingData} />
      </>
    );
  } catch (error) {
    console.error('Booking details error:', error);
    notFound();
  }
}
