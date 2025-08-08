import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import SettingsClient from './settings-client-new';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireAuth(['student', 'teacher', 'admin']);

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Inställningar</h1>
            <p className="text-gray-300">Hantera ditt konto och personliga uppgifter</p>
          </div>
          
          <SettingsClient />
        </div>
      </div>
    </div>
  );
}
