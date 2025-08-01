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
    <div className="min-h-screen">
      {/* Admin Navigation Bar */}
      <nav className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center py-3 gap-2">
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base"
            >
              🏠 Översikt
            </Link>
            <Link
              href="/dashboard/admin/bookings"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base"
            >
              📅 Bokningar
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base"
            >
              👥 Användare
            </Link>
            <Link
              href="/dashboard/admin/lessons"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base"
            >
              📚 Lektioner
            </Link>
            <Link
              href="/dashboard/admin/slots"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base"
            >
              ⏰ Tidsluckor
            </Link>
            <Link
              href="/dashboard/admin/settings"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base"
            >
              ⚙️ Inställningar
            </Link>
            <Link
              href="/dashboard/admin/email-templates"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base"
            >
              ✉️ E-postmallar
            </Link>
            <Link
              href="/dashboard/admin/migrate"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm md:text-base text-yellow-300"
            >
              🔧 Databasuppdateringar
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
