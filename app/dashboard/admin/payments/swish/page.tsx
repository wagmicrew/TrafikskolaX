import { requireAuth } from '@/lib/auth/server-auth';
import SwishPaymentsClient from './swish-payments-client';

export const dynamic = 'force-dynamic';

export default async function SwishPaymentsPage() {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 border-b border-white/10">
              <h1 className="text-2xl font-bold text-white mb-2">Swish Betalningar</h1>
              <p className="text-gray-300">Hantera alla Swish-betalningar och transaktioner</p>
            </div>
          </div>
        </div>
        
        <SwishPaymentsClient />
      </div>
    </div>
  );
}