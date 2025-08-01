import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, lessonTypes, users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import BookingDetailClient from './booking-detail-client';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const user = await requireAuth('student');
  const { id } = await params;

  // Fetch booking details with lesson type and teacher info
  const bookingDetails = await db
    .select({
      id: bookings.id,
      userId: bookings.userId,
      lessonTypeId: bookings.lessonTypeId,
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      totalPrice: bookings.totalPrice,
      notes: bookings.notes,
      isCompleted: bookings.isCompleted,
      durationMinutes: bookings.durationMinutes,
      transmissionType: bookings.transmissionType,
      swishUUID: bookings.swishUUID,
      createdAt: bookings.createdAt,
      // Lesson type info
      lessonTypeName: lessonTypes.name,
      lessonTypeDescription: lessonTypes.description,
      lessonTypePrice: lessonTypes.price,
      // Teacher info
      teacherFirstName: users.firstName,
      teacherLastName: users.lastName,
      teacherEmail: users.email,
      teacherPhone: users.phone,
    })
    .from(bookings)
    .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
    .leftJoin(users, eq(bookings.teacherId, users.id))
    .where(and(
      eq(bookings.id, id),
      eq(bookings.userId, user.id),
      isNull(bookings.deletedAt)
    ));

  if (bookingDetails.length === 0) {
    notFound();
  }

  const booking = bookingDetails[0];

  return (
    <BookingDetailClient booking={booking} user={user} />
  );
}
