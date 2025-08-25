import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
// Internal messaging has been deprecated. Show notice instead of messages UI.

export const dynamic = 'force-dynamic';

export default async function TeacherMessagesPage() {
  const user = await requireAuth(['teacher']);

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lärar Meddelanden</h1>
            <p className="text-gray-600">Kommunicera med dina elever och kollegor</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Interna meddelanden är borttagna</h2>
              <p className="text-gray-600">
                Funktionen för interna meddelanden är avvecklad. Vänligen använd e‑postnotiser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
