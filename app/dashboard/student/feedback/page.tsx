'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import StudentFeedbackClient from './student-feedback-client';
import StudentHeader from '../StudentHeader';
import { MessageSquare } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar feedback...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  if (!feedbackData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Kunde inte ladda feedback-data</p>
          <p className="text-gray-500 text-sm mt-2">Försök uppdatera sidan</p>
        </div>
      </div>
    );
  }

  // Transform JWTPayload to match StudentFeedbackClient's User interface
  const transformedUser = {
    id: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader
        title="Lärarfeedback"
        icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
        userName={user.firstName}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentFeedbackClient
          user={transformedUser}
          feedback={feedbackData.feedback}
          total={feedbackData.total}
        />
      </div>
    </div>
  );
}
