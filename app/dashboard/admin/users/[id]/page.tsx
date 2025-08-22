import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { users, bookings } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import UserDetailClient from './user-detail-client';

export const dynamic = 'force-dynamic';

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Ensure admin access
  await requireAuth('admin');

  const { id } = params;

  if (id === 'new') {
    // Render a creation dialog instead of fetching
    return <UserDetailClient user={{
      id: 'new',
      firstName: '',
      lastName: '',
      email: '',
      role: 'student',
      isActive: true,
      inskriven: false,
      inskrivenDate: null,
      customPrice: null,
      bookingCount: 0,
    }} />;
  }

  // Fetch user details with booking count using a separate query
  const userData = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const bookingCountResult = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(bookings)
    .where(eq(bookings.userId, id));

  const bookingCount = Number(bookingCountResult[0]?.count || 0);

  if (!userData.length) {
    notFound();
  }

  const userDataItem = userData[0];
  const user = {
    id: userDataItem.id,
    firstName: userDataItem.firstName,
    lastName: userDataItem.lastName,
    email: userDataItem.email,
    phone: userDataItem.phone || undefined,
    role: userDataItem.role,
    isActive: userDataItem.isActive,
    inskriven: userDataItem.inskriven,
    inskrivenDate: userDataItem.inskrivenDate?.toISOString() || null,
    customPrice: userDataItem.customPrice?.toString() || null,
    bookingCount,
    profileImage: userDataItem.profileImage || undefined,
    personalNumber: userDataItem.personalNumber || undefined,
    riskEducation1: userDataItem.riskEducation1 || undefined,
    riskEducation2: userDataItem.riskEducation2 || undefined,
    knowledgeTest: userDataItem.knowledgeTest || undefined,
    drivingTest: userDataItem.drivingTest || undefined,
    teacherNotes: userDataItem.notes || undefined,
  };

  return <UserDetailClient user={user} />;
}
