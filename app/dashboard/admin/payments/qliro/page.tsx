import { requireAuth } from '@/lib/auth/server-auth';
import PaymentHubClient from './payment-hub-client';

export const dynamic = 'force-dynamic';

export default async function PaymentHubPage() {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20 border-b border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Betalningshubben</h1>
                  <p className="text-gray-300">Centraliserad hantering av alla betalningar och transaktioner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📱</span>
              </div>
              <span className="text-green-400 text-sm font-medium">AKTIV</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Swish</h3>
            <p className="text-green-200 text-sm mb-4">Snabb och säker mobilbetalning</p>
            <div className="flex justify-between items-end">
              <span className="text-green-300 text-xs">Idag</span>
              <span className="text-white font-bold text-xl">--</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">💳</span>
              </div>
              <span className="text-purple-400 text-sm font-medium">AKTIV</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Qliro</h3>
            <p className="text-purple-200 text-sm mb-4">Flera betalningsalternativ</p>
            <div className="flex justify-between items-end">
              <span className="text-purple-300 text-xs">Idag</span>
              <span className="text-white font-bold text-xl">--</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
              <span className="text-blue-400 text-sm font-medium">AKTIV</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Krediter</h3>
            <p className="text-blue-200 text-sm mb-4">Förbetalda lektioner</p>
            <div className="flex justify-between items-end">
              <span className="text-blue-300 text-xs">Aktiva</span>
              <span className="text-white font-bold text-xl">--</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Snabbåtgärder
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="/dashboard/admin/payments/swish"
                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl p-4 text-center transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-white text-sm">📱</span>
                </div>
                <p className="text-green-200 font-medium text-sm">Swish</p>
              </a>
              <a
                href="/dashboard/admin/payments/qliro"
                className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl p-4 text-center transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-white text-sm">💳</span>
                </div>
                <p className="text-purple-200 font-medium text-sm">Qliro</p>
              </a>
              <a
                href="/dashboard/admin/settings/qliro"
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl p-4 text-center transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-white text-sm">⚙️</span>
                </div>
                <p className="text-blue-200 font-medium text-sm">Inställningar</p>
              </a>
              <a
                href="/dashboard/admin/bookings"
                className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl p-4 text-center transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-white text-sm">📋</span>
                </div>
                <p className="text-yellow-200 font-medium text-sm">Bokningar</p>
              </a>
            </div>
          </div>
        </div>

        <PaymentHubClient />
      </div>
    </div>
  );
}