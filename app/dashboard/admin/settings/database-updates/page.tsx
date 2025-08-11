import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export const runtime = 'nodejs';

const DatabaseUpdatesClient = dynamic(
  () => import('./database-updates-client'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    ),
  }
);

export default function DatabaseUpdatesPage() {
  return (
    <>
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Databasuppdateringar</h1>
          <p className="text-slate-300 mt-1">Lista och kör SQL‑migreringar. Var försiktig – ta backup först.</p>
        </div>
        <DatabaseUpdatesClient />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: { iconTheme: { primary: '#0ea5e9', secondary: '#0b1220' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0b1220' } },
        }}
      />
    </>
  );
}
