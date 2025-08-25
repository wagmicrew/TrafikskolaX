import { requireAuth } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import StudentHeader from '../StudentHeader'
import { FaEnvelope } from 'react-icons/fa'
// Internal messaging has been deprecated. Show notice instead of messages UI.

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const user = await requireAuth(['student']);
  if (!user) redirect('/');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="px-6 pt-8">
        <StudentHeader title="Meddelanden" icon={<FaEnvelope className="text-purple-300" />} />
      </div>
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-2">Interna meddelanden är borttagna</h2>
            <p className="text-slate-300">
              Funktionen för interna meddelanden är avvecklad. Vänligen kontakta oss via e‑post.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
