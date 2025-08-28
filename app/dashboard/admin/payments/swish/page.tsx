import { requireAuth } from '@/lib/auth/server-auth';
import PaymentHubClient from '../qliro/payment-hub-client';

export const dynamic = 'force-dynamic';

export default async function SwishPaymentsPage() {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-green-600/20 to-blue-600/20 border-b border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Swish Betalningar</h1>
                  <p className="text-gray-300">Hantera alla Swish-betalningar och transaktioner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Swish-specific Stats */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Swish Status</h3>
                <p className="text-green-200 text-sm mb-4">Snabb och säker mobilbetalning är aktiv</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-sm">QR-kod generering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-green-300 text-sm">Callback hantering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-green-300 text-sm">Admin bekräftelse</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400 mb-2">--</div>
                <p className="text-green-300 text-sm">Aktiva idag</p>
              </div>
            </div>
          </div>
        </div>

        <PaymentHubClient />
      </div>
    </div>
  );
}