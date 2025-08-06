'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ExportSchedule } from '@/components/Admin/ExportSchedule';

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-lg">Välkommen, {user.firstName} {user.lastName}!</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportSchedule />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Bokningar</h2>
          <p className="text-gray-100">Hantera alla bokningar</p>
          <Link href="/dashboard/admin/bookings" className="inline-block mt-4 bg-white text-green-700 py-2 px-4 rounded hover:bg-gray-100 transition-colors">Öppna</Link>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Användare</h2>
          <p className="text-gray-100">Hantera elever och lärare</p>
          <Link href="/dashboard/admin/users" className="inline-block mt-4 bg-white text-purple-700 py-2 px-4 rounded hover:bg-gray-100 transition-colors">Öppna</Link>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-red-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Lektioner & Paket</h2>
          <p className="text-gray-100">Hantera lektionspaket</p>
          <Link href="/dashboard/admin/lessons" className="inline-block mt-4 bg-white text-yellow-700 py-2 px-4 rounded hover:bg-gray-100 transition-colors">Öppna</Link>
        </div>

        <div className="bg-gradient-to-r from-orange-400 to-pink-600 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Handledarkurs</h2>
          <p className="text-gray-100">Hantera handledarkurser & bokningar</p>
          <Link href="/dashboard/admin/handledarkurs" className="inline-block mt-4 bg-white text-orange-700 py-2 px-4 rounded hover:bg-gray-100 transition-colors">Öppna</Link>
        </div>

        <div className="bg-gradient-to-r from-teal-400 to-indigo-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Inställningar</h2>
          <p className="text-gray-100">Konfigurera systemet</p>
          <Link href="/dashboard/admin/settings" className="inline-block mt-4 bg-white text-teal-700 py-2 px-4 rounded hover:bg-gray-100 transition-colors">Öppna</Link>
        </div>
        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Debug & Logging</h2>
          <p className="text-gray-100">View system logs and debug information</p>
          <Link href="/dashboard/admin/logging" className="inline-block mt-4 bg-white text-blue-700 py-2 px-4 rounded hover:bg-gray-100 transition-colors">Open</Link>
        </div>
      </div>
    </div>
  );
}
