import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { users, bookings } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import UsersClient from './users-client';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string; page?: string }>;
}) {
  // Ensure admin access
  await requireAuth('admin');

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const roleFilter = params.role || '';
  const searchFilter = params.search || '';

  // Build conditions
  const conditions = [];
  if (roleFilter) {
    conditions.push(eq(users.role, roleFilter as any));
  }
  if (searchFilter) {
    conditions.push(
      sql`(${users.firstName} ILIKE ${`%${searchFilter}%`} OR ${users.lastName} ILIKE ${`%${searchFilter}%`} OR ${users.email} ILIKE ${`%${searchFilter}%`})`
    );
  }

  // Fetch users with booking counts
  const allUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      inskriven: users.inskriven,
      inskrivenDate: users.inskrivenDate,
      customPrice: users.customPrice,
      personalNumber: users.personalNumber,
      address: users.address,
      postalCode: users.postalCode,
      city: users.city,
      dateOfBirth: users.dateOfBirth,
      createdAt: users.createdAt,
      bookingCount: sql<number>`(
        SELECT COUNT(*) FROM ${bookings} 
        WHERE ${bookings.userId} = ${users.id}
        AND ${bookings.scheduledDate} >= CURRENT_DATE
      )`,
    })
    .from(users)
    .where(conditions.length > 0 ? sql`${conditions.join(' AND ')}` : undefined)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count for pagination
  const totalCount = await db
    .select({ count: sql`count(*)` })
    .from(users)
    .where(conditions.length > 0 ? sql`${conditions.join(' AND ')}` : undefined)
    .then((result) => Number(result[0].count));

  // Get user statistics
  const userStats = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.role);

  return (
    <UsersClient
      users={allUsers}
      userStats={userStats}
      currentPage={page}
      totalPages={Math.ceil(totalCount / pageSize)}
      roleFilter={roleFilter}
      searchFilter={searchFilter}
    />
  );
}
