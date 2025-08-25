import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server-auth';
import Link from 'next/link';
import { ShieldCheck, Home, CalendarDays, Users, BookOpen, Clock8, Settings, Mail, ChevronDown, CreditCard, Trash2 } from 'lucide-react';
import ScrollToTopButton from '@/components/ui/scroll-to-top-button';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Scroll to top button */}
      <ScrollToTopButton />
      {/* Admin Navigation Bar */}
  <nav className="relative z-40 backdrop-blur-md bg-white/10 border-b border-white/10 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center py-3 gap-2">
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              <span className="inline-flex items-center gap-2"><Home className="w-4 h-4" /> Översikt</span>
            </Link>
            <div className="relative group">
              <Link
                href="/dashboard/admin/bookings"
                className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10 inline-flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" /> Bokningar <ChevronDown className="w-3 h-3 opacity-70" />
              </Link>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute z-30 mt-2 min-w-[240px] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
                <div className="py-2">
                  <Link href="/dashboard/admin/bookings" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Aktuella Bokningar</Link>
                  <Link href="/dashboard/admin/bookings-old" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Arkiverade Bokningar</Link>
                  <Link href="/dashboard/admin/booking-tools" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Bokningsverktyg</Link>
                  <Link href="/dashboard/admin/booking-settings" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Bokningsinställningar</Link>
                  <div className="border-t border-white/10 my-1"></div>
                  <Link href="/dashboard/admin/invoices" className="block px-4 py-2 hover:bg-white/10 rounded-lg text-green-300">Fakturor</Link>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/admin/users"
              className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10"
            >
              <span className="inline-flex items-center gap-2"><Users className="w-4 h-4" /> Användare</span>
            </Link>
            <div className="relative group">
              <Link
                href="/dashboard/admin/cms"
                className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10 inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" /> Hemsidan <ChevronDown className="w-3 h-3 opacity-70" />
              </Link>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute z-30 mt-2 min-w-[220px] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
                <div className="py-2">
                  <Link href="/dashboard/admin/cms" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Sidredigerare</Link>
                  <Link href="/dashboard/admin/cms" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Menyredigerare</Link>
                  <Link href="/dashboard/admin/settings/email" className="block px-4 py-2 hover:bg-white/10 rounded-lg">E-postmallar</Link>
                  <Link href="/dashboard/admin/settings" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Inställningar</Link>
                  <Link href="/dashboard/admin/settings/database-updates" className="block px-4 py-2 hover:bg-white/10 rounded-lg text-yellow-300">Databashantering</Link>
                  <Link href="/dashboard/admin/setup" className="block px-4 py-2 hover:bg-white/10 rounded-lg text-green-300">Setuphjälp</Link>
                </div>
              </div>
            </div>
            <div className="relative group">
              <Link
                href="/dashboard/admin/school"
                className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10 inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Skolan <ChevronDown className="w-3 h-3 opacity-70" />
              </Link>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute z-30 mt-2 min-w-[240px] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
                <div className="py-2">
                  <Link href="/dashboard/admin/lessons" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Lektioner & Paket</Link>
                  <Link href="/dashboard/admin/lesson-content" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Lektionsinnehåll</Link>
                  <Link href="/dashboard/admin/slots" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Öppettider</Link>
                  <Link href="/dashboard/admin/teori-lesson-types" className="block px-4 py-2 hover:bg-white/10 rounded-lg text-blue-300">Teorihantering</Link>
                  <div className="border-t border-white/10 my-1"></div>
                  <Link href="/dashboard/admin/teori-sessions" className="block px-4 py-2 hover:bg-white/10 rounded-lg text-emerald-300 font-semibold">Sessionshantering</Link>
                </div>
              </div>
            </div>
            <div className="relative group">
              <Link
                href="/dashboard/admin/settings"
                className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10 inline-flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Inställningar <ChevronDown className="w-3 h-3 opacity-70" />
              </Link>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute z-30 mt-2 min-w-[240px] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
                <div className="py-2">
                  <Link href="/dashboard/admin/settings" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Inställningar</Link>
                  <Link href="/dashboard/admin/settings/database-updates" className="block px-4 py-2 hover:bg-white/10 rounded-lg text-yellow-300">Databasuppdateringar</Link>
                  <Link href="/dashboard/admin/supervisor-cleanup" className="block px-4 py-2 hover:bg-white/10 rounded-lg text-red-300">Handledare Data Cleanup</Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <Link
                href="/dashboard/admin/payments/qliro"
                className="px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm md:text-base border border-white/10 inline-flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Betalningar <ChevronDown className="w-3 h-3 opacity-70" />
              </Link>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute z-[9999] mt-2 min-w-[240px] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
                <div className="py-2">
                  <Link href="/dashboard/admin/payments/qliro" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Qliro</Link>
                  <Link href="/dashboard/admin/payments/swish" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Swish</Link>
                  <Link href="/dashboard/admin/payments/bankgiro" className="block px-4 py-2 hover:bg-white/10 rounded-lg">Bankgiro</Link>
                </div>
              </div>
            </div>
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
