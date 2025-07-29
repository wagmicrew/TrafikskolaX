import { requireAuth } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

export default async function AdminSlotsPage() {
  await requireAuth('admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tidsluckor</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Hantera Tidsluckor</h2>
        <p className="text-gray-600 mb-4">
          Här kan du konfigurera tillgängliga tider för lektioner och blockera specifika tider.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">⏰ Schemaläggning</h3>
            <p className="text-sm text-gray-600">Konfigurera dagliga tidsluckor och arbetstider</p>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Kommande snart
            </button>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">🚫 Blockerade Tider</h3>
            <p className="text-sm text-gray-600">Blockera specifika datum och tider</p>
            <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Kommande snart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
