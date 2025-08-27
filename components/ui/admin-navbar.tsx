'use client';

import React from 'react';
import Link from 'next/link';
import {
  Navbar,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  DarkThemeToggle,
} from 'flowbite-react';
import {
  ShieldCheck,
  Home,
  CalendarDays,
  Users,
  BookOpen,
  Clock8,
  Settings,
  Mail,
  Globe,
  ChevronDown,
  CreditCard,
  Trash2,
  FileText,
  Database,
  GraduationCap,
  CreditCardIcon,
  BarChart3,
  Bell,
  UserCog,
  Package,
  Receipt,
  Activity
} from 'lucide-react';

export default function AdminNavbar() {
  return (
    <Navbar
      fluid
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50"
    >
      <NavbarBrand as={Link} href="/dashboard/admin">
        <ShieldCheck className="mr-3 h-6 w-6 text-blue-600" />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          Administration
        </span>
      </NavbarBrand>

      <div className="flex md:order-2">
        <DarkThemeToggle />
        <NavbarToggle />
      </div>

      <NavbarCollapse>
        {/* Overview */}
        <NavbarLink as={Link} href="/dashboard/admin" className="flex items-center">
          <Home className="mr-2 h-4 w-4" />
          Översikt
        </NavbarLink>

        {/* Bookings Dropdown */}
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              Bokningar
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
          }
        >
          <DropdownItem as={Link} href="/dashboard/admin/bookings" icon={CalendarDays}>
            Aktuella Bokningar
          </DropdownItem>
          <DropdownItem as={Link} href="/dashboard/admin/bookings-old" icon={FileText}>
            Arkiverade Bokningar
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem as={Link} href="/dashboard/admin/invoices" icon={Receipt}>
            Fakturor
          </DropdownItem>
        </Dropdown>

        {/* Users */}
        <NavbarLink as={Link} href="/dashboard/admin/users" className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Användare
        </NavbarLink>

        {/* Website Management Dropdown */}
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Hemsidan
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
          }
        >

          <DropdownItem as={Link} href="/dashboard/admin/email-templates" icon={Mail}>
            E-postmallar
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem as={Link} href="/dashboard/admin/settings/database-updates" icon={Database}>
            Databashantering
          </DropdownItem>

        </Dropdown>

        {/* School Management Dropdown */}
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <div className="flex items-center">
              <GraduationCap className="mr-2 h-4 w-4" />
              Skolan
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
          }
        >
          <DropdownItem as={Link} href="/dashboard/admin/lessons" icon={BookOpen}>
            Lektioner & Paket
          </DropdownItem>
          <DropdownItem as={Link} href="/dashboard/admin/lesson-content" icon={FileText}>
            Lektionsinnehåll
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem as={Link} href="/dashboard/admin/slots" icon={Clock8}>
            Slothantering
          </DropdownItem>
          <DropdownItem as={Link} href="/dashboard/admin/skolan/oppettider" icon={Clock8}>
            Öppettider
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem as={Link} href="/dashboard/admin/teorihantering" icon={Activity}>
            Teorihantering
          </DropdownItem>
        </Dropdown>

        {/* Settings Dropdown */}
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <div className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Inställningar
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
          }
        >
          <DropdownItem as={Link} href="/dashboard/admin/settings" icon={Settings}>
            Inställningar
          </DropdownItem>
          <DropdownItem as={Link} href="/dashboard/admin/settings/database-updates" icon={Database}>
            Databasuppdateringar
          </DropdownItem>
          <DropdownItem as={Link} href="/dashboard/admin/supervisor-cleanup" icon={Trash2}>
            Handledare Data Cleanup
          </DropdownItem>
        </Dropdown>

        {/* Payments Dropdown */}
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Betalningar
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
          }
        >
          <DropdownItem as={Link} href="/dashboard/admin/payments/qliro" icon={CreditCardIcon}>
            Qliro
          </DropdownItem>
          <DropdownItem as={Link} href="/dashboard/admin/payments/swish" icon={CreditCardIcon}>
            Swish
          </DropdownItem>
        </Dropdown>
      </NavbarCollapse>
    </Navbar>
  );
}
