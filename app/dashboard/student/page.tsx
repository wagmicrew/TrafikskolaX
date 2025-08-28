'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import StudentDashboardClient from './student-dashboard-client';
import { OrbSpinner } from '@/components/ui/orb-loader';
import { TrueFocusText } from '@/components/ui/true-focus-text';

export default function Studentsidan() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'student')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      
      // Fetch bookings
      const bookingsRes = await fetch('/api/student/bookings');
      const bookingsData = await bookingsRes.json();
      
      // Fetch credits
      const creditsRes = await fetch('/api/user/credits');
      const creditsData = await creditsRes.json();
      
      // Fetch user packages
      const packagesRes = await fetch('/api/user/packages');
      const packagesData = await packagesRes.json();
      
      // Fetch feedback
      const feedbackRes = await fetch('/api/student/feedback');
      const feedbackData = await feedbackRes.json();

      // Fetch invoices
      const invoicesRes = await fetch('/api/invoices');
      const invoicesData = await invoicesRes.json();

      const rawBookings = bookingsData.bookings || [];
      
      // Transform API data to match BookingsTable interface
      const bookings = rawBookings.map((b: any) => ({
        id: b.id,
        date: b.scheduledDate,
        time: b.startTime,
        type: b.lessonTypeName,
        status: b.status,
        paymentStatus: b.paymentStatus,
        studentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        instructorName: b.teacherName,
        price: b.totalPrice || 0,
        paidAmount: b.totalPrice || 0,
        notes: b.notes,
        createdAt: b.createdAt,
        updatedAt: b.createdAt
      }));
      
      // Sort bookings for better display
      const now = new Date();
      const sortedBookings = bookings.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      const totalBookings = sortedBookings.length;
      const completedBookings = sortedBookings.filter((b: any) => b.status === 'completed').length;
      const upcomingBookings = sortedBookings.filter((b: any) => {
        const bookingDate = new Date(`${b.date}T${b.time}`);
        return b.status !== 'completed' && b.status !== 'cancelled' && bookingDate >= now;
      }).length;
      const totalCredits = creditsData.credits?.reduce((sum: number, c: any) => sum + c.creditsRemaining, 0) || 0;

      // Calculate invoice statistics
      const invoices = invoicesData.invoices || [];
      const pendingInvoices = invoices.filter((inv: any) => inv.status === 'pending').length;
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid').length;
      const totalInvoiceAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

      setDashboardData({
        bookings: sortedBookings,
        credits: creditsData.credits || [],
        userPackages: packagesData.packages || [],
        feedback: feedbackData.feedback || [],
        invoices: invoices,
        stats: {
          totalBookings,
          completedBookings,
          upcomingBookings,
          totalCredits,
          totalInvoices: invoices.length,
          pendingInvoices,
          paidInvoices,
          totalInvoiceAmount
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar elevdashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Kunde inte ladda dashboard-data</p>
          <p className="text-gray-500 text-sm mt-2">Försök uppdatera sidan</p>
        </div>
      </div>
    );
  }

  // Map JWT payload to User interface expected by StudentDashboardClient
  const mappedUser = {
    id: user.userId,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    avatar: user.profileImage
  };

  return (
    <StudentDashboardClient 
      user={mappedUser}
      bookings={dashboardData.bookings}
      credits={dashboardData.credits}
      userPackages={dashboardData.userPackages}
      feedback={dashboardData.feedback}
      stats={dashboardData.stats}
    />
  );
}
