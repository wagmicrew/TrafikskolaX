"use client";

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const SideditorClient = dynamic(
  () => import('./sideditor-client'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    ),
  }
);

export default function SideditorPage() {
  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Sideditor</h1>
          <p className="text-slate-300 mt-1">Redigera innehåll på publika sidor med WYSIWYG-editor</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      }>
        <SideditorClient />
      </Suspense>
    </div>
  );
}
