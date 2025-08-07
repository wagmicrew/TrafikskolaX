import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { gte, desc, eq, and, sql } from 'drizzle-orm';
import BookingsClient from './bookings-client';

export const dynamic = 'force-dynamic';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; page?: string; showPast?: string }>;
}) {
  // Ensure admin access
  await requireAuth('admin');

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const selectedUserId = params.user || '';
  const showPast = params.showPast === 'true';

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Build conditions
  const conditions = [];
  
  // Only filter by date if not showing past bookings
  if (!showPast) {
    conditions.push(gte(bookings.scheduledDate, today));
  }
  
  if (selectedUserId) {
    conditions.push(eq(bookings.userId, selectedUserId));
  }

  // Fetch bookings with user, lesson type, and teacher information
  const bookingsList = await db
    .select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      durationMinutes: bookings.durationMinutes,
      transmissionType: bookings.transmissionType,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      totalPrice: bookings.totalPrice,
      isCompleted: bookings.isCompleted,
      isGuestBooking: bookings.isGuestBooking,
      createdAt: bookings.createdAt,
      userName: sql`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${bookings.guestName})`,
      userEmail: sql`COALESCE(${users.email}, ${bookings.guestEmail})`,
      userPhone: sql`COALESCE(${users.phone}, ${bookings.guestPhone})`,
      userId: bookings.userId,
      lessonTypeName: lessonTypes.name,
      teacherId: bookings.teacherId,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.scheduledDate), desc(bookings.startTime))
    .limit(pageSize)
    .offset(offset);

  // Get total count for pagination
  const totalCount = await db
    .select({ count: sql`count(*)` })
    .from(bookings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .then((result) => Number(result[0].count));

  // Fetch all users for the filter
  const usersList = await db
    .select({
      id: users.id,
      name: sql`${users.firstName} || ' ' || ${users.lastName}`,
      email: users.email,
    })
    .from(users)
    .orderBy(users.firstName, users.lastName);

  return (
    <BookingsClient
      bookings={bookingsList}
      users={usersList}
      currentPage={page}
      totalPages={Math.ceil(totalCount / pageSize)}
      selectedUserId={selectedUserId}
      showPast={showPast}
    />
  );
}
