"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';


export default function QliroSettingsPage() {
  const QliroSettingsClient = dynamic(() => import('./qliro-settings-client'), {
    loading: () => (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    ),
    ssr: false,
  });

  return (
    <>
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Qliro betalningar</h1>
            <p className="text-slate-300 mt-1">Hantera Qliro-betalningar, export, återbetalningar och API-test</p>
          </div>
        </div>
        <QliroSettingsClient />
      </div>
    </>
  );
}
