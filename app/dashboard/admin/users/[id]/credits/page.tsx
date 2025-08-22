import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import CreditsManagementClient from './credits-client';
import BackButton from './back-button';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserCreditsPage({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch user data
  const user = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user.length) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton />
      <CreditsManagementClient userId={user[0]?.id || ''} />
    </div>
  );
}
