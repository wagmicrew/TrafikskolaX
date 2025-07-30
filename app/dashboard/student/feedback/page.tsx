'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import StudentFeedbackClient from './student-feedback-client';

export default function StudentFeedbackPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'student')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchFeedbackData();
    }
  }, [user]);

  const fetchFeedbackData = async () => {
    try {
      setDataLoading(true);
      
      // Fetch feedback
      const feedbackRes = await fetch('/api/student/feedback');
      const feedbackData = await feedbackRes.json();
      
      setFeedbackData(feedbackData);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
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

  if (!feedbackData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Kunde inte ladda feedback data</p>
      </div>
    );
  }

  return (
    <StudentFeedbackClient 
      user={user}
      feedback={feedbackData.feedback}
      total={feedbackData.total}
    />
  );
}
