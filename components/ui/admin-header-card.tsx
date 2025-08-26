'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaUsers,
  FaCalendar,
  FaCog,
  FaFileAlt,
  FaGraduationCap,
  FaChartBar,
  FaEnvelope,
  FaCreditCard,
  FaShieldAlt,
  FaBookOpen,
  FaClock,
  FaDatabase,
  FaGlobe,
  FaCreditCard as FaCreditCardAlt,
  FaTrash,
  FaChevronDown,
  FaRocket,
  FaTools,
  FaWrench,
  FaHome,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { HiChartPie } from 'react-icons/hi';
import { Home } from 'lucide-react';
import {
  Card,
  DarkThemeToggle,
  Dropdown,
  DropdownItem,
  DropdownDivider
} from 'flowbite-react';

interface AdminHeaderCardProps {
  currentPage?: string;
  pageDescription?: string;
}

export default function AdminHeaderCard({
  currentPage,
  pageDescription
}: AdminHeaderCardProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Helper function to get page title from pathname
  function getPageTitleFromPath(pathname: string): string {
    const pathSegments = pathname.split('/').filter(Boolean);

    // Remove 'dashboard' and 'admin' from the path
    const adminPath = pathSegments.slice(2); // Skip 'dashboard' and 'admin'

    if (adminPath.length === 0) {
      return 'Administration';
    }

    const pageMap: Record<string, string> = {
      'bookings': 'Bokningar',
      'bookings-old': 'Arkiverade Bokningar',
      'users': 'Användare',
      'lessons': 'Lektioner',
      'slots': 'Slothantering',
      'settings': 'Inställningar',
      'cms': 'Hemsidan',
      'email-templates': 'E-postmallar',
      'teori-sessions': 'Teorisessioner',
      'logs': 'Loggar',
      'invoices': 'Fakturor',
      'payments': 'Betalningar',
      'setup': 'Setuphjälp',
      'migrate': 'Migrering',
      'meddelande': 'Meddelanden',
      'handledarkurs': 'Handledarkurs',
      'lesson-content': 'Lektionsinnehåll',
      'logging': 'Loggning',
      'teori-lesson-types': 'Teorihantering',
      'teori-management': 'Teorihantering',
      'supervisor-cleanup': 'Handledare Data Cleanup',
      'swish-approvals': 'Swish-godkännanden',
      'packages-store': 'Paketbutik',
      'utbildningskort': 'Utbildningskort'
    };

    // Check nested paths (e.g., settings/qliro, payments/swish)
    if (adminPath.length > 1) {
      const nestedPage = adminPath.join('/');
      const nestedMap: Record<string, string> = {
        'settings/qliro': 'Qliro-inställningar',
        'settings/database-updates': 'Databasuppdateringar',
        'settings/sideditor': 'Sidredigerare',
        'payments/qliro': 'Qliro-betalningar',
        'payments/swish': 'Swish-betalningar',
        'skolan/oppettider': 'Öppettider',
        'users/credits': 'Användarpoäng',
        'bookings/id': 'Bokningsdetaljer',
        'invoices/id': 'Fakturadetaljer',
        'invoices/edit': 'Redigera Faktura',
        'lessons/new': 'Ny Lektion',
        'lessons/id': 'Redigera Lektion',
        'lessons/id/edit': 'Redigera Lektion'
      };

      if (nestedMap[nestedPage]) {
        return nestedMap[nestedPage];
      }

      // Handle dynamic ID routes
      if (adminPath.length >= 3 && adminPath[2] === 'edit') {
        return `${pageMap[adminPath[1]] || adminPath[1]} - Redigera`;
      }
      if (adminPath.length >= 2 && !isNaN(Number(adminPath[1]))) {
        return `${pageMap[adminPath[0]] || adminPath[0]} - Detaljer`;
      }
    }

    return pageMap[adminPath[0]] || adminPath[0].charAt(0).toUpperCase() + adminPath[0].slice(1);
  }

  // Get current page title from pathname if not provided
  const pageTitle = currentPage || getPageTitleFromPath(pathname);

  // Default descriptions for common pages
  const getDefaultDescription = (page: string): string => {
    const descriptions: Record<string, string> = {
      'Administration': 'Välkommen till administrationspanelen',
      'Bokningar': 'Hantera alla bokningar och scheman',
      'Användare': 'Hantera studenter, lärare och administratörer',
      'Lektioner': 'Konfigurera lektionstyper och priser',
      'Slothantering': 'Hantera tillgängliga tidsluckor',
      'Inställningar': 'Systemkonfiguration och inställningar',
      'Qliro-betalningar': 'Hantera Qliro-betalningar',
      'E-postmallar': 'Hantera e-postmallar och meddelanden',
      'Teorisessioner': 'Hantera teorilektioner, sessioner och deltagare',
      'Loggar': 'Systemloggar och debugging',
      'Fakturor': 'Hantera fakturor och betalningar',
      'Innehåll': 'Hantera webbplatsinnehåll och CMS',
      'Sidredigerare': 'Redigera webbplatsens sidor',
      'Databashantering': 'Hantera databasuppdateringar',
      'Setuphjälp': 'Konfigurera och ställa in systemet'
    };
    return descriptions[page] || `${page} - Administrationspanel`;
  };

  const description = pageDescription || getDefaultDescription(pageTitle);

  return (
    <div className="w-full sticky top-0 z-30 -mt-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 m-0 rounded-none">
        <div className="p-4">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                <FaShieldAlt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {pageTitle}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  {description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Välkommen tillbaka, {user?.firstName || 'Admin'}!
                </p>
              </div>
            </div>

            {/* Dark Theme Toggle */}
            <div className="flex items-center gap-3">
              <DarkThemeToggle />
            </div>
          </div>

          {/* Multi-tier Menu Bar */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-wrap items-center justify-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-2 shadow-inner">
              {/* Overview */}
              <Link href="/dashboard/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md">
                <Home className="w-4 h-4" />
                <span>Översikt</span>
              </Link>

              {/* Bokningar Dropdown */}
              <Dropdown
                arrowIcon={false}
                inline
                placement="bottom"
                className="z-50"
                label={
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
                    <FaCalendar className="w-4 h-4" />
                    <span>Bokningar</span>
                    <FaChevronDown className="w-3 h-3 opacity-70" />
                  </div>
                }
              >
                <DropdownItem as={Link} href="/dashboard/admin/bookings" icon={FaCalendar}>
                  Aktuella Bokningar
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/bookings-old" icon={FaFileAlt}>
                  Arkiverade Bokningar
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem as={Link} href="/dashboard/admin/invoices" icon={FaCreditCardAlt}>
                  Fakturor
                </DropdownItem>
              </Dropdown>

              {/* Användare */}
              <Link href="/dashboard/admin/users" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md">
                <FaUsers className="w-4 h-4" />
                <span>Användare</span>
              </Link>

              {/* Slothantering */}
              <Link href="/dashboard/admin/slots" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md">
                <FaClock className="w-4 h-4" />
                <span>Slothantering</span>
              </Link>

              {/* Hemsidan Dropdown */}
              <Dropdown
                arrowIcon={false}
                inline
                placement="bottom"
                className="z-50"
                label={
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
                    <FaGlobe className="w-4 h-4" />
                    <span>Hemsidan</span>
                    <FaChevronDown className="w-3 h-3 opacity-70" />
                  </div>
                }
              >
                <DropdownItem as={Link} href="/dashboard/admin/cms" icon={FaGlobe}>
                  Sidredigerare
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/email-templates" icon={FaEnvelope}>
                  E-postmallar
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem as={Link} href="/dashboard/admin/settings/database-updates" icon={FaDatabase}>
                  Databashantering
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/setup" icon={FaCog}>
                  Setuphjälp
                </DropdownItem>
              </Dropdown>

              {/* Skolan Dropdown */}
              <Dropdown
                arrowIcon={false}
                inline
                placement="bottom"
                className="z-50"
                label={
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
                    <FaBookOpen className="w-4 h-4" />
                    <span>Skolan</span>
                    <FaChevronDown className="w-3 h-3 opacity-70" />
                  </div>
                }
              >
                <DropdownItem as={Link} href="/dashboard/admin/lessons" icon={FaBookOpen}>
                  Lektioner & Paket
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/lesson-content" icon={FaFileAlt}>
                  Lektionsinnehåll
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem as={Link} href="/dashboard/admin/skolan/oppettider" icon={FaClock}>
                  Öppettider
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/slots" icon={FaClock}>
                  Slothantering
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/teori-lesson-types" icon={FaGraduationCap}>
                  Teorihantering
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/teori-sessions" icon={HiChartPie}>
                  Sessionshantering
                </DropdownItem>
              </Dropdown>

              {/* Inställningar Dropdown */}
              <Dropdown
                arrowIcon={false}
                inline
                placement="bottom"
                className="z-50"
                label={
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
                    <FaCog className="w-4 h-4" />
                    <span>Inställningar</span>
                    <FaChevronDown className="w-3 h-3 opacity-70" />
                  </div>
                }
              >
                <DropdownItem as={Link} href="/dashboard/admin/settings" icon={FaCog}>
                  Inställningar
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/settings/database-updates" icon={FaDatabase}>
                  Databasuppdateringar
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/supervisor-cleanup" icon={FaTrash}>
                  Handledare Data Cleanup
                </DropdownItem>
              </Dropdown>

              {/* Betalningar Dropdown */}
              <Dropdown
                arrowIcon={false}
                inline
                placement="bottom"
                className="z-50"
                label={
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
                    <FaCreditCard className="w-4 h-4" />
                    <span>Betalningar</span>
                    <FaChevronDown className="w-3 h-3 opacity-70" />
                  </div>
                }
              >
                <DropdownItem as={Link} href="/dashboard/admin/payments/qliro" icon={FaCreditCardAlt}>
                  Qliro
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/payments/swish" icon={FaCreditCardAlt}>
                  Swish
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
