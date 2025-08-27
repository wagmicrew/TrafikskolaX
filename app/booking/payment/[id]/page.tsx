import { db } from '@/lib/db';
import { bookings, users, lessonTypes, invoices, siteSettings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import BookingPaymentClient from './payment-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingPaymentPage({ params }: PageProps) {
  const { id: bookingId } = await params;

  // Load booking details with related data
  const bookingRows = await db
    .select({
      id: bookings.id,
      userId: bookings.userId,
      lessonTypeId: bookings.lessonTypeId,
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      durationMinutes: bookings.durationMinutes,
      transmissionType: bookings.transmissionType,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      swishUUID: bookings.swishUUID,
      teacherId: bookings.teacherId,
      isGuestBooking: bookings.isGuestBooking,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (bookingRows.length === 0) {
    notFound();
  }

  const booking = bookingRows[0];

  // Load lesson type details
  const lessonTypeRows = await db
    .select({
      id: lessonTypes.id,
      name: lessonTypes.name,
      description: lessonTypes.description,
      durationMinutes: lessonTypes.durationMinutes,
      price: lessonTypes.price,
    })
    .from(lessonTypes)
    .where(eq(lessonTypes.id, booking.lessonTypeId))
    .limit(1);

  const lessonType = lessonTypeRows[0] ? {
    ...lessonTypeRows[0],
    type: 'lesson' as const, // Default type since lessonTypes table doesn't have type column
    price: Number(lessonTypeRows[0].price)
  } : null;

  // Load user details
  let userDetails = null;
  if (booking.userId) {
    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    if (userRows.length > 0) {
      userDetails = userRows[0];
    }
  }

  // Load invoice details if exists
  const invoiceRows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(eq(invoices.bookingId, bookingId))
    .limit(1);

  const invoice = invoiceRows[0] ? {
    ...invoiceRows[0],
    amount: Number(invoiceRows[0].amount)
  } : null;

  // Load site settings
  const settingsRows = await db.select().from(siteSettings);
  const settings = settingsRows.reduce((acc: Record<string, any>, cur: any) => {
    acc[cur.key] = cur.value;
    return acc;
  }, {} as Record<string, any>);

  const schoolName = settings.schoolname || settings.site_name || 'Din Trafikskola Hässleholm';
  const schoolPhone = settings.school_phonenumber || '';
  const swishNumber = settings.swish_number || '';
  const schoolAddress = settings.school_address || '';
  const googleMapsApiKey = settings.google_maps_api_key || '';
  const mapsEmbedUrl = settings.maps_embed_url
    || (schoolAddress
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleMapsApiKey)}&q=${encodeURIComponent(schoolAddress)}`
      : '');

  const isPaid = (booking.paymentStatus || '').toLowerCase() === 'paid';

  // Convert booking data to proper types
  const bookingWithCorrectTypes = {
    ...booking,
    totalPrice: Number(booking.totalPrice || 0),
    status: booking.status || 'confirmed',
    isGuestBooking: booking.isGuestBooking || false
  };

  // Fix invoice status null issue
  const invoiceWithCorrectTypes = invoice ? {
    ...invoice,
    status: (invoice.status as string) || 'pending'
  } : null;

  return (
    <BookingPaymentClient
      booking={bookingWithCorrectTypes}
      lessonType={lessonType}
      user={userDetails}
      invoice={invoiceWithCorrectTypes}
      settings={{ schoolName, schoolPhone, swishNumber, schoolAddress, mapsEmbedUrl }}
      isPaid={isPaid}
    />
  );
}


