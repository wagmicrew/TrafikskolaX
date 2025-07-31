import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import UtbildningskortClient from '../utbildningskort-client';

export const dynamic = 'force-dynamic';

export default async function UtbildningskortUserPage() {
  const user = await requireAuth(['teacher', 'admin']);

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <UtbildningskortClient />
      </div>
    </div>
  );
}
