import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server-auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Admin Navigation Bar */}
      <nav className="backdrop-blur-md bg-white/10 border-b border-white/10 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center py-3 gap-2">
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              🏠 Översikt
            </Link>
            <Link
              href="/dashboard/admin/bookings"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              📅 Bokningar
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              👥 Användare
            </Link>
            <Link
              href="/dashboard/admin/lessons"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              📚 Lektioner
            </Link>
            <Link
              href="/dashboard/admin/slots"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              ⏰ Tidsluckor
            </Link>
            <Link
              href="/dashboard/admin/settings"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              ⚙️ Inställningar
            </Link>
            <Link
              href="/dashboard/admin/email-templates"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              ✉️ E-postmallar
            </Link>
            <Link
              href="/dashboard/admin/migrate"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base text-yellow-300 border border-white/10"
            >
              🔧 Databasuppdateringar
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
