import { db } from '@/lib/db';
import { bookings, siteSettings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import BookingPaymentClient from './payment-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BookingPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db
    .select({ id: bookings.id, totalPrice: bookings.totalPrice, paymentStatus: bookings.paymentStatus, userId: bookings.userId, scheduledDate: bookings.scheduledDate, startTime: bookings.startTime, endTime: bookings.endTime })
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  if (rows.length === 0) notFound();
  const booking = rows[0] as any;

  const settingsRows = await db.select().from(siteSettings);
  const settings = settingsRows.reduce((acc: Record<string, any>, cur: any) => { acc[cur.key] = cur.value; return acc; }, {} as Record<string, any>);
  const swishNumber = settings.swish_number || '';
  const schoolName = settings.schoolname || settings.site_name || 'Din Trafikskola Hässleholm';
  const schoolPhone = settings.school_phonenumber || '';

  return <BookingPaymentClient booking={booking} settings={{ swishNumber, schoolName, schoolPhone }} />;
}


