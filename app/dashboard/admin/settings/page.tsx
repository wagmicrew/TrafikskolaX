import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { Loader2, Settings as SettingsIcon, Edit } from 'lucide-react';

export const runtime = 'nodejs';

// Use dynamic import without ssr: false for Next.js 15 compatibility
const SettingsClient = dynamic(
  () => import('./settings-client'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    ),
  }
);

export default function SettingsPage() {
  return (
    <>
      <div className="mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inställningar</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Konfigurera funktioner och utseende för systemet</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/settings/database-updates"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              Databasuppdateringar
            </Link>
            <Link
              href="/dashboard/admin/settings/sideditor"
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Sideditor
            </Link>
          </div>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        }>
          <SettingsClient />
        </Suspense>
      </div>
    </>
  );
}
