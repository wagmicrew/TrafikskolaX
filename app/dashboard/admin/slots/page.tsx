import { requireAuth } from '@/lib/auth/server-auth';
import SlotsClient from './slots-client';

export const dynamic = 'force-dynamic';

export default async function AdminSlotsPage() {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <SlotsClient />
      </div>
    </div>
  );
}
