import { requireAuth } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

export default async function AdminMigratePage() {
  await requireAuth('admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Databasuppdateringar</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Varning - Avancerade Funktioner
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Dessa verktyg kan påverka databasstrukturen. Använd med försiktighet.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Tillgängliga Migreringar</h2>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">🔧 Schema Uppdateringar</h3>
            <p className="text-sm text-gray-600 mb-3">
              Uppdatera databasschema med de senaste tabellerna och kolumnerna.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Kör Migration
            </button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">📊 Data Import</h3>
            <p className="text-sm text-gray-600 mb-3">
              Importera grundläggande data som lektionstyper och inställningar.
            </p>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Importera Data
            </button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">🗄️ Databas Status</h3>
            <p className="text-sm text-gray-600 mb-3">
              Kontrollera databasanslutning och tabellstatus.
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Kontrollera Status
            </button>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Farliga Operationer
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Dessa operationer kan inte ångras. Säkerhetskopiera först.</p>
              <div className="mt-3">
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" disabled>
                  Återställ Databas (Inaktiverad)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
