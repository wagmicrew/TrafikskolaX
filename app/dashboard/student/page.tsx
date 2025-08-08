'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import StudentDashboardClient from './student-dashboard-client';

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
      
      // Fetch feedback
      const feedbackRes = await fetch('/api/student/feedback');
      const feedbackData = await feedbackRes.json();

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

      setDashboardData({
        bookings: sortedBookings,
        credits: creditsData.credits || [],
        feedback: feedbackData.feedback || [],
        stats: {
          totalBookings,
          completedBookings,
          upcomingBookings,
          totalCredits
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Kunde inte ladda dashboard data</p>
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
      feedback={dashboardData.feedback}
      stats={dashboardData.stats}
    />
  );
}
