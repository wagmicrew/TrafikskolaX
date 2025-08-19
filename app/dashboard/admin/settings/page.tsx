import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Administratörsinställningar</h1>
            <p className="text-slate-300 mt-1">Konfigurera funktioner och utseende för systemet</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/admin/settings/database-updates"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
            >
              Databasuppdateringar
            </Link>
          </div>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        }>
          <SettingsClient />
        </Suspense>
      </div>
    </>
  );
}
