import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { users, bookings } from '@/lib/db/schema';
import { sql, desc, eq, and, or, not, like } from 'drizzle-orm';
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

  // Build conditions array
  const conditions = [];
  
  // Add role filter if specified
  if (roleFilter) {
    conditions.push(eq(users.role, roleFilter as any));
  }
  
  // Add search filter if specified
  if (searchFilter) {
    conditions.push(
      or(
        like(users.firstName, `%${searchFilter}%`),
        like(users.lastName, `%${searchFilter}%`),
        like(users.email, `%${searchFilter}%`)
      )
    );
  }
  
  // Always exclude temporary users
  conditions.push(not(like(users.email, 'orderid-%@dintrafikskolahlm.se')));
  conditions.push(not(like(users.email, 'temp-%@%')));
  conditions.push(not(eq(users.firstName, 'Temporary')));

  // Create the where clause
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
      inskrivenDate: sql<string | null>`CASE WHEN ${users.inskrivenDate} IS NOT NULL THEN ${users.inskrivenDate}::text ELSE NULL END`,
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
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count for pagination
  const totalCount = await db
    .select({ count: sql`count(*)` })
    .from(users)
    .where(whereClause)
    .then((result) => Number(result[0].count));

  // Get user statistics
  const userStats = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        not(like(users.email, 'orderid-%@dintrafikskolahlm.se')),
        not(like(users.email, 'temp-%@%')),
        not(eq(users.firstName, 'Temporary'))
      )
    )
    .groupBy(users.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <UsersClient
          users={allUsers}
          userStats={userStats}
          currentPage={page}
          totalPages={Math.ceil(totalCount / pageSize)}
          roleFilter={roleFilter}
          searchFilter={searchFilter}
        />
      </div>
    </div>
  );
}
