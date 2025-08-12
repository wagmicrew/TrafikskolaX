import { db } from '@/lib/db';
import { handledarBookings, handledarSessions, siteSettings, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import PaymentLandingClient from './payment-landing-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HandledarPaymentPage({ params }: PageProps) {
  const { id: bookingId } = await params;

  // Load booking + session details
  const bookingRows = await db
    .select({
      id: handledarBookings.id,
      sessionId: handledarBookings.sessionId,
      studentId: handledarBookings.studentId,
      supervisorName: handledarBookings.supervisorName,
      supervisorEmail: handledarBookings.supervisorEmail,
      supervisorPhone: handledarBookings.supervisorPhone,
      price: handledarBookings.price,
      paymentStatus: handledarBookings.paymentStatus,
      paymentMethod: handledarBookings.paymentMethod,
      status: handledarBookings.status,
      createdAt: handledarBookings.createdAt,
      updatedAt: handledarBookings.updatedAt,
    })
    .from(handledarBookings)
    .where(eq(handledarBookings.id, bookingId))
    .limit(1);

  if (bookingRows.length === 0) {
    notFound();
  }

  const booking = bookingRows[0];

  const sessionRows = await db
    .select({
      id: handledarSessions.id,
      title: handledarSessions.title,
      description: handledarSessions.description,
      date: handledarSessions.date,
      startTime: handledarSessions.startTime,
      endTime: handledarSessions.endTime,
      pricePerParticipant: handledarSessions.pricePerParticipant,
    })
    .from(handledarSessions)
    .where(eq(handledarSessions.id, booking.sessionId))
    .limit(1);

  if (sessionRows.length === 0) {
    notFound();
  }

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

  return (
    <PaymentLandingClient
      booking={booking}
      session={sessionRows[0]}
      settings={{ schoolName, schoolPhone, swishNumber, schoolAddress, mapsEmbedUrl }}
      isPaid={isPaid}
    />
  );
}


