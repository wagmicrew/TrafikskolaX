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

      const bookings = bookingsData.bookings || [];
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter((b: any) => b.isCompleted).length;
      const upcomingBookings = bookings.filter((b: any) => 
        !b.isCompleted && new Date(b.scheduledDate) >= new Date()
      ).length;
      const totalCredits = creditsData.credits?.reduce((sum: number, c: any) => sum + c.creditsRemaining, 0) || 0;

      setDashboardData({
        bookings,
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

  return (
    <StudentDashboardClient 
      user={user}
      bookings={dashboardData.bookings}
      credits={dashboardData.credits}
      feedback={dashboardData.feedback}
      stats={dashboardData.stats}
    />
  );
}
