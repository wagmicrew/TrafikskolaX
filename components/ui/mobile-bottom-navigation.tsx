'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FaHome,
  FaCalendar,
  FaUsers,
  FaCog,
  FaBookOpen,
  FaCreditCard,
  FaEnvelope,
  FaClock,
  FaCoins,
  FaGraduationCap,
  FaGlobe,
  FaShieldAlt,
  FaWrench
} from 'react-icons/fa';
import { Home } from 'lucide-react';

interface MobileBottomNavigationProps {
  userRole?: 'admin' | 'student' | 'teacher';
}

export default function MobileBottomNavigation({ userRole }: MobileBottomNavigationProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Helper function to check if current path matches menu item
  const isActive = (href: string) => {
    if (href === '/dashboard/admin' || href === '/dashboard/student') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Admin menu items
  const adminMenuItems = [
    {
      href: '/dashboard/admin',
      icon: Home,
      label: 'Översikt',
      active: isActive('/dashboard/admin') && !pathname.includes('/bookings') && !pathname.includes('/users') && !pathname.includes('/settings')
    },
    {
      href: '/dashboard/admin/bookings',
      icon: FaCalendar,
      label: 'Bokningar',
      active: isActive('/dashboard/admin/bookings')
    },
    {
      href: '/dashboard/admin/users',
      icon: FaUsers,
      label: 'Användare',
      active: isActive('/dashboard/admin/users')
    },
    {
      href: '/dashboard/admin/settings',
      icon: FaCog,
      label: 'Inställningar',
      active: isActive('/dashboard/admin/settings')
    }
  ];

  // Student menu items
  const studentMenuItems = [
    {
      href: '/dashboard/student',
      icon: Home,
      label: 'Hem',
      active: isActive('/dashboard/student') && !pathname.includes('/bokningar') && !pathname.includes('/feedback') && !pathname.includes('/learning')
    },
    {
      href: '/dashboard/student/bokningar',
      icon: FaCalendar,
      label: 'Bokningar',
      active: isActive('/dashboard/student/bokningar')
    },
    {
      href: '/dashboard/student/learning',
      icon: FaBookOpen,
      label: 'Lärande',
      active: isActive('/dashboard/student/learning')
    },
    {
      href: '/dashboard/settings',
      icon: FaCog,
      label: 'Inställningar',
      active: isActive('/dashboard/settings')
    }
  ];

  // Teacher menu items (if needed in the future)
  const teacherMenuItems = [
    {
      href: '/dashboard/teacher',
      icon: Home,
      label: 'Hem',
      active: isActive('/dashboard/teacher') && !pathname.includes('/bookings') && !pathname.includes('/feedback')
    },
    {
      href: '/dashboard/teacher/bookings',
      icon: FaCalendar,
      label: 'Bokningar',
      active: isActive('/dashboard/teacher/bookings')
    },
    {
      href: '/dashboard/teacher/feedback',
      icon: FaGraduationCap,
      label: 'Feedback',
      active: isActive('/dashboard/teacher/feedback')
    },
    {
      href: '/dashboard/settings',
      icon: FaCog,
      label: 'Inställningar',
      active: isActive('/dashboard/settings')
    }
  ];

  // Determine which menu items to show based on user role
  const menuItems = userRole === 'admin' ? adminMenuItems :
                   userRole === 'teacher' ? teacherMenuItems :
                   studentMenuItems;

  return (
    <>
      {/* Bottom Navigation - Only visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors duration-200 ${
                  item.active
                    ? 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <IconComponent className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform duration-200" />
                <span className={`text-xs font-medium ${
                  item.active
                    ? 'text-blue-600 dark:text-blue-500'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Add padding to body to account for fixed bottom navigation on mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </>
  );
}
