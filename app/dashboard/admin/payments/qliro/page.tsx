import { requireAuth } from '@/lib/auth/server-auth';
import QliroPaymentsClient from './qliro-payments-client';

export const dynamic = 'force-dynamic';

export default async function QliroPaymentsPage() {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10">
              <h1 className="text-2xl font-bold text-white mb-2">Qliro Betalningar</h1>
              <p className="text-gray-300">Hantera alla Qliro-betalningar och transaktioner</p>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg">Qliro Testverktyg</h2>
                <p className="text-gray-300 text-sm">Kör anslutningstest och skapa testorder i sandbox.</p>
              </div>
              <a
                href="/dashboard/admin/settings/qliro"
                className="inline-flex items-center gap-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 transition"
              >
                Öppna testverktyg
              </a>
            </div>
          </div>
        </div>

        <QliroPaymentsClient />
      </div>
    </div>
  );
}