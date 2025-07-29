import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import MessagesClient from '../../student/meddelande/messages-client';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const user = await requireAuth(['admin']);

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Meddelanden</h1>
            <p className="text-gray-600">Hantera alla interna meddelanden och frågor</p>
          </div>
          
          <MessagesClient />
        </div>
      </div>
    </div>
  );
}
