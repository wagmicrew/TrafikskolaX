import { db } from '@/lib/db';
import { bookings, users } from '@/lib/db/schema';
import { gte, desc, eq, and, sql } from 'drizzle-orm';
import BookingsClient from './bookings-client';

export const dynamic = 'force-dynamic';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { user?: string; page?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const selectedUserId = searchParams.user || '';

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build conditions
  const conditions = [gte(bookings.bookingDate, today)];
  if (selectedUserId) {
    conditions.push(eq(bookings.userId, selectedUserId));
  }

  // Fetch bookings with user information
  const bookingsList = await db
    .select({
      id: bookings.id,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      lessonType: bookings.lessonType,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      isCompleted: bookings.isCompleted,
      createdAt: bookings.createdAt,
      userName: sql`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${bookings.guestName})`,
      userEmail: sql`COALESCE(${users.email}, ${bookings.guestEmail})`,
      userPhone: sql`COALESCE(${users.phone}, ${bookings.guestPhone})`,
      userId: bookings.userId,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(bookings.bookingDate), desc(bookings.startTime))
    .limit(pageSize)
    .offset(offset);

  // Get total count for pagination
  const totalCount = await db
    .select({ count: sql`count(*)` })
    .from(bookings)
    .where(and(...conditions))
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
    />
  );
}
