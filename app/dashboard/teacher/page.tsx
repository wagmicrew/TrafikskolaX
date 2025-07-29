import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import TeacherDashboardClient from './teacher-dashboard-client';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboard() {
  const user = await requireAuth(['teacher']);

  if (!user) {
    redirect('/');
  }

  return <TeacherDashboardClient user={user} />;
}
