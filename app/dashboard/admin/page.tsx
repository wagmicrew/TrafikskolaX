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
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">Adminpanel</h1>
          <p className="text-slate-300">Välkommen, {user.firstName} {user.lastName}!</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/10 border border-white/20 text-white">
            <ExportSchedule />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Bokningar', desc: 'Hantera alla bokningar', href: '/dashboard/admin/bookings' },
          { title: 'Användare', desc: 'Hantera elever och lärare', href: '/dashboard/admin/users' },
          { title: 'Lektioner & paket', desc: 'Hantera lektionspaket', href: '/dashboard/admin/lessons' },
          { title: 'Handledarkurs', desc: 'Hantera handledarkurser & bokningar', href: '/dashboard/admin/handledarkurs' },
          { title: 'Inställningar', desc: 'Konfigurera systemet', href: '/dashboard/admin/settings' },
          { title: 'Loggar & felsökning', desc: 'Visa loggar och felsök', href: '/dashboard/admin/logging' },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg">
            <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
            <p className="text-slate-200">{card.desc}</p>
            <Link href={card.href} className="inline-block mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">Öppna</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
