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
  FaBell
} from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/inloggning?redirect=%2Fdashboard%2Fadmin');
      return;
    }

    // Fetch dashboard stats
    fetchStats();
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
      title: 'E-postmallar',
      description: 'Hantera e-postmallar och meddelanden',
      href: '/dashboard/admin/email-templates',
      icon: FaEnvelope,
      color: 'bg-indigo-500'
    },
    {
      title: 'Handledarutbildning',
      description: 'Hantera handledarutbildningar',
      href: '/dashboard/admin/handledarkurs',
      icon: FaGraduationCap,
      color: 'bg-teal-500'
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
    <div className="text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
          <FaShieldAlt className="w-8 h-8 text-sky-300" />
          Admin Dashboard
        </h1>
        <div className="text-slate-300">
          Välkommen tillbaka, {user.firstName}!
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 border border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Totalt Användare</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-sky-500/20 rounded-xl">
                <FaUsers className="h-8 w-8 text-sky-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Totalt Bokningar</p>
                <p className="text-3xl font-bold text-white">{stats.totalBookings}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <FaCalendar className="h-8 w-8 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Väntande</p>
                <p className="text-3xl font-bold text-white">{stats.pendingBookings}</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <FaExclamationTriangle className="h-8 w-8 text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Genomförda</p>
                <p className="text-3xl font-bold text-white">{stats.completedBookings}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <FaCheckCircle className="h-8 w-8 text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Snabbåtgärder</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={() => router.push('/dashboard/admin/bookings')}
            className="h-auto p-4 flex flex-col items-center space-y-2 bg-sky-500 hover:bg-sky-600 text-white"
          >
            <FaCalendar className="h-6 w-6" />
            <span>Hantera Bokningar</span>
          </Button>
          
          <Button 
            onClick={() => router.push('/dashboard/admin/users')}
            className="h-auto p-4 flex flex-col items-center space-y-2 bg-green-500 hover:bg-green-600 text-white"
          >
            <FaUsers className="h-6 w-6" />
            <span>Hantera Användare</span>
          </Button>
          
          <Button 
            onClick={() => router.push('/dashboard/admin/settings')}
            className="h-auto p-4 flex flex-col items-center space-y-2 bg-purple-500 hover:bg-purple-600 text-white"
          >
            <FaCog className="h-6 w-6" />
            <span>Inställningar</span>
          </Button>
          
          <Button 
            onClick={() => router.push('/dashboard/meddelande')}
            className="h-auto p-4 flex flex-col items-center space-y-2 bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <FaEnvelope className="h-6 w-6" />
            <span>Meddelanden</span>
          </Button>
        </div>
      </div>

      {/* Admin Tools Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Admin Verktyg</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adminLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="h-full bg-white/10 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${link.color} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      {link.count !== undefined && (
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {link.count}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg font-semibold text-white mb-2">
                      {link.title}
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      {link.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Export Schedule Component */}
      <div className="mt-8">
        <ExportSchedule userId={user?.userId} role="admin" />
      </div>
    </div>
  );
}
