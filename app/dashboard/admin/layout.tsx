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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
          <nav className="space-y-2">
            <Link
              href="/dashboard/admin"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Översikt
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Användarhantering
            </Link>
            <Link
              href="/dashboard/admin/lessons"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Lektioner & Paket
            </Link>
            <Link
              href="/dashboard/admin/bookings"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Bokningar
            </Link>
            <Link
              href="/dashboard/admin/slots"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Tidsluckor
            </Link>
            <Link
              href="/dashboard/admin/settings"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              Inställningar
            </Link>
            <Link
              href="/dashboard/admin/migrate"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors text-yellow-400"
            >
              Databasuppdateringar
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
