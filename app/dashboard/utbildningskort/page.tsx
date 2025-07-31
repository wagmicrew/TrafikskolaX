import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import UserSettingsClient from './user-settings-client';

export const dynamic = 'force-dynamic';

export default async function UserSettingsPage() {
  const user = await requireAuth(['student', 'teacher', 'admin']);

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <UserSettingsClient />
      </div>
    </div>
  );
}
