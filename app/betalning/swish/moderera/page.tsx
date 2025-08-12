"use client";
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export default function SwishModerationPage() {
  const ModerateClient = dynamic(() => import('./moderate-client'), {
    loading: () => (
      <div className="flex items-center justify-center min-h-[320px] text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    ),
    ssr: false,
  });
  return <ModerateClient />;
}


