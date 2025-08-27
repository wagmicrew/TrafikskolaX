'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
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
  FaWrench
} from 'react-icons/fa';
// Removed HiChartPie as sessions link is consolidated
import { Home } from 'lucide-react';
import {
  Card,
  DarkThemeToggle,
  Dropdown,
  DropdownItem,
  DropdownDivider
} from 'flowbite-react';

interface AdministrationPanelProps {
  currentPage?: string;
}

export default function AdministrationPanel({ currentPage = "Administration" }: AdministrationPanelProps) {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="shadow-2xl border-0 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 mb-8">
        <div className="p-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                <FaShieldAlt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {currentPage}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
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

              {/* (Removed) Top-level Slothantering moved under Skolan */}

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

                <DropdownItem as={Link} href="/dashboard/admin/email-templates" icon={FaEnvelope}>
                  E-postmallar
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem as={Link} href="/dashboard/admin/settings/database-updates" icon={FaDatabase}>
                  Databashantering
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
                <DropdownItem as={Link} href="/dashboard/admin/slots" icon={FaClock}>
                  Slothantering
                </DropdownItem>
                <DropdownItem as={Link} href="/dashboard/admin/skolan/oppettider" icon={FaClock}>
                  Öppettider
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem as={Link} href="/dashboard/admin/teorihantering" icon={FaGraduationCap}>
                  Teorihantering
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
