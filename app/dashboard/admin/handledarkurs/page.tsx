'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import HandledarSessionManager from './HandledarSessionManager';

export default function HandledarkursAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
          <p className="text-white mt-4">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="mb-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-sky-600/20 to-purple-600/20 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white">Handledarkurs Management</h1>
            <p className="text-gray-300 mt-1">Skapa och hantera handledar utbildningssessioner</p>
          </div>
        </div>
      </div>
      <HandledarSessionManager />
    </div>
  );
}
