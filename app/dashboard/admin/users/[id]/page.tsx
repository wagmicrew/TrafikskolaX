import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import UserDetailClient from './user-detail-client';

export const dynamic = 'force-dynamic';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Ensure admin access
  await requireAuth('admin');

  const { id } = await params;

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

  // Fetch user details
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (user.length === 0) {
    notFound();
  }

  return <UserDetailClient user={user[0]} />;
}
