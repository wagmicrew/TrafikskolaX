import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
// Internal messaging has been deprecated. Show notice instead of messages UI.

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const user = await requireAuth(['admin']);

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-sky-600/20 to-purple-600/20 border-b border-white/10">
              <h1 className="text-2xl font-bold text-white mb-2">Admin Meddelanden</h1>
              <p className="text-gray-300">Hantera alla interna meddelanden och frågor</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-2">Interna meddelanden är borttagna</h2>
            <p className="text-gray-300">
              Funktionen för interna meddelanden är avvecklad. Använd e‑postnotiser och mallar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
