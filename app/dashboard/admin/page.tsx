'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExportSchedule from '@/components/Admin/ExportSchedule';
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
  FaCheckCircle,
  FaExclamationTriangle,
  FaDatabase,
  FaEnvelopeOpen,
  FaBell,
  FaRocket,
  FaTools,
  FaWrench,
  FaGlobe,
  FaCreditCard as FaCreditCardAlt,
  FaTrash,
  FaChevronDown
} from 'react-icons/fa';
import {
  Card,
  Button,
  Badge,
  ButtonGroup,
  DarkThemeToggle,
  Dropdown,
  DropdownItem,
  DropdownDivider
} from 'flowbite-react';
import { HiOutlineArrowRight, HiChartPie, HiUserGroup, HiOfficeBuilding, HiCurrencyDollar } from 'react-icons/hi';
import { Home } from 'lucide-react';
// import AdministrationPanel from '@/components/ui/administration-panel';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    unreadMessages: 0
  });
  const [internalMessagesEnabled, setInternalMessagesEnabled] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login?redirect=%2Fdashboard%2Fadmin');
      return;
    }

    // Fetch dashboard stats
    fetchStats();
    // Fetch internal messages toggle
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setInternalMessagesEnabled(Boolean(data?.settings?.internal_messages_enabled)))
      .catch(() => setInternalMessagesEnabled(true));
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const adminLinks = [
    {
      title: 'Bokningar',
      description: 'Hantera alla bokningar och scheman',
      href: '/dashboard/admin/bookings',
      icon: FaCalendar,
      color: 'bg-sky-500',
      count: stats.totalBookings
    },
    {
      title: 'Användare',
      description: 'Hantera studenter, lärare och administratörer',
      href: '/dashboard/admin/users',
      icon: FaUsers,
      color: 'bg-green-500',
      count: stats.totalUsers
    },
    {
      title: 'Lektionstyper',
      description: 'Konfigurera lektionstyper och priser',
      href: '/dashboard/admin/lessons',
      icon: FaBookOpen,
      color: 'bg-purple-500'
    },
    {
      title: 'Tidsluckor',
      description: 'Hantera tillgängliga tidsluckor',
      href: '/dashboard/admin/slots',
      icon: FaClock,
      color: 'bg-orange-500'
    },
    {
      title: 'Inställningar',
      description: 'Systemkonfiguration och inställningar',
      href: '/dashboard/admin/settings',
      icon: FaCog,
      color: 'bg-gray-500'
    },
    {
      title: 'Qliro-betalningar',
      description: 'Hantera Qliro-betalningar',
      href: '/dashboard/admin/settings/qliro',
      icon: FaCreditCard,
      color: 'bg-rose-500'
    },
    {
      title: 'E-postmallar',
      description: 'Hantera e-postmallar och meddelanden',
      href: '/dashboard/admin/email-templates',
      icon: FaEnvelope,
      color: 'bg-indigo-500'
    },
    {
      title: 'Teorisessioner',
      description: 'Hantera teorilektioner, sessioner och deltagare',
      href: '/dashboard/admin/teori-sessions',
      icon: FaBookOpen,
      color: 'bg-blue-600'
    },
    {
      title: 'Loggar',
      description: 'Systemloggar och debugging',
      href: '/dashboard/admin/logs',
      icon: FaDatabase,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Statistics Cards - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-blue-100 font-semibold text-sm uppercase tracking-wider">Totalt Användare</p>
                <p className="text-4xl font-black text-white mt-1">{stats.totalUsers}</p>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <HiUserGroup className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-green-100 font-semibold text-sm uppercase tracking-wider">Totalt Bokningar</p>
                <p className="text-4xl font-black text-white mt-1">{stats.totalBookings}</p>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaCalendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-yellow-100 font-semibold text-sm uppercase tracking-wider">Väntande</p>
                <p className="text-4xl font-black text-white mt-1">{stats.pendingBookings}</p>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaExclamationTriangle className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-purple-100 font-semibold text-sm uppercase tracking-wider">Genomförda</p>
                <p className="text-4xl font-black text-white mt-1">{stats.completedBookings}</p>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaCheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions - Centered and Popping */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
            <FaRocket className="inline-block w-8 h-8 mr-3 text-red-500" />
            Snabbåtgärder
          </h2>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
              <Button
                onClick={() => router.push('/dashboard/admin/bookings')}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
              >
                <FaCalendar className="h-6 w-6" />
                <span className="text-sm">Hantera Bokningar</span>
              </Button>

              <Button
                onClick={() => router.push('/dashboard/admin/users')}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
              >
                <FaUsers className="h-6 w-6" />
                <span className="text-sm">Hantera Användare</span>
              </Button>

              <Button
                onClick={() => router.push('/dashboard/admin/settings')}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
              >
                <FaCog className="h-6 w-6" />
                <span className="text-sm">Inställningar</span>
              </Button>

              {internalMessagesEnabled && (
                <Button
                  onClick={() => router.push('/dashboard/meddelande')}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
                >
                  <FaEnvelope className="h-6 w-6" />
                  <span className="text-sm">Meddelanden</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Admin Tools - Bento Grid */}
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
            <FaTools className="inline-block w-8 h-8 mr-3 text-yellow-500" />
            Admin Verktyg
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {adminLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Card className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 hover:transform hover:scale-105 cursor-pointer group">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${link.color} text-white shadow-lg`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        {link.count !== undefined && (
                          <Badge color="dark" className="bg-gray-900 text-white font-bold px-3 py-1 shadow-md">
                            {link.count}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {link.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                        {link.description}
                      </p>

                      <div className="flex items-center text-red-600 dark:text-red-400 font-semibold text-sm group-hover:text-red-700 dark:group-hover:text-red-300">
                        Öppna verktyg
                        <HiOutlineArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Export Schedule Component */}
        <div className="mt-12">
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                <FaWrench className="inline w-6 h-6 mr-2 text-yellow-500" />
                Exportera Schema
              </h3>
              <ExportSchedule userId={user?.userId} role="admin" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
