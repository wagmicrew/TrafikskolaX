

import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes, invoices, invoiceItems, siteSettings, teacherAvailability } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import AdminBookingDetailsClient from './admin-booking-details-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailsPage({ params }: PageProps) {
  // Ensure admin access
  await requireAuth('admin');

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
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      totalPrice: bookings.totalPrice,
      swishUUID: bookings.swishUUID,
      teacherId: bookings.teacherId,
      isGuestBooking: bookings.isGuestBooking,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      notes: bookings.notes
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (bookingRows.length === 0) {
    throw new Error('Booking not found');
  }

  const booking = bookingRows[0];

  // Load user details
  let userDetails = null;
  if (booking.userId) {
    const userRows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        customerNumber: users.customerNumber,
        isActive: users.isActive,
        personalNumber: users.personalNumber,
        dateOfBirth: users.dateOfBirth,
        address: users.address,
        postalCode: users.postalCode,
        city: users.city,
        licenseNumber: users.licenseNumber
      })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    userDetails = userRows[0] || null;
  }

  // Load lesson type details
  let lessonTypeDetails = null;
  if (booking.lessonTypeId) {
    const lessonTypeRows = await db
      .select({
        id: lessonTypes.id,
        name: lessonTypes.name,
        description: lessonTypes.description,
        durationMinutes: lessonTypes.durationMinutes,
        price: lessonTypes.price,
        priceStudent: lessonTypes.priceStudent,
        salePrice: lessonTypes.salePrice,
        isActive: lessonTypes.isActive
      })
      .from(lessonTypes)
      .where(eq(lessonTypes.id, booking.lessonTypeId))
      .limit(1);

    lessonTypeDetails = lessonTypeRows[0] ? {
      ...lessonTypeRows[0],
      type: 'lesson' as const,
      price: Number(lessonTypeRows[0].price)
    } : null;
  }

  // Load teacher details
  let teacherDetails = null;
  if (booking.teacherId) {
    const teacherRows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        licenseNumber: users.licenseNumber
      })
      .from(users)
      .where(eq(users.id, booking.teacherId))
      .limit(1);

    teacherDetails = teacherRows[0] || null;
  }

  // Load invoice details
  const invoiceRows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt
    })
    .from(invoices)
    .where(eq(invoices.bookingId, bookingId))
    .limit(1);

  const invoice = invoiceRows[0] ? {
    ...invoiceRows[0],
    amount: Number(invoiceRows[0].amount)
  } : null;

  // Load invoice items
  let invoiceItemsList = [];
  if (invoice) {
    invoiceItemsList = await db
      .select({
        id: invoiceItems.id,
        description: invoiceItems.description,
        quantity: invoiceItems.quantity,
        unitPrice: invoiceItems.unitPrice,
        amount: invoiceItems.amount,
        itemType: invoiceItems.itemType,
        itemReference: invoiceItems.itemReference
      })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));
  }

  // Load site settings
  const settingsRows = await db.select().from(siteSettings);
  const settings = settingsRows.reduce((acc: Record<string, any>, cur: any) => {
    acc[cur.key] = cur.value;
    return acc;
  }, {});

  return (
    <AdminBookingDetailsClient
      booking={booking}
      lessonType={lessonTypeDetails}
      user={userDetails}
      teacher={teacherDetails}
      invoice={invoice}
      invoiceItems={invoiceItemsList}
      settings={{
        schoolName: settings.schoolname || settings.site_name || 'Din Trafikskola Hässleholm',
        schoolPhone: settings.school_phonenumber || '',
        swishNumber: settings.swish_number || '',
        schoolAddress: settings.school_address || '',
        mapsEmbedUrl: settings.maps_embed_url || ''
      }}
    />
  );
}
