import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server-auth';
import ScrollToTopButton from '@/components/ui/scroll-to-top-button';
import AdminHeaderCard from '@/components/ui/admin-header-card';
import MobileBottomNavigation from '@/components/ui/mobile-bottom-navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Scroll to top button */}
      <ScrollToTopButton />

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:block">
        {/* Main Content */}
        <main className="">
          <div className="container mx-auto px-4 py-8">
            <AdminHeaderCard />
            <div className="mt-6">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Layout - No header, bottom navigation */}
      <div className="md:hidden">
        <main className="">
          <div className="container mx-auto px-4 py-8">
            <div className="pb-20"> {/* Add padding bottom for mobile bottom nav */}
              {children}
            </div>
          </div>
        </main>
        <MobileBottomNavigation userRole="admin" />
      </div>
    </div>
  );
}
