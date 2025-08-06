"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaClock, 
  FaCreditCard, 
  FaShoppingCart, 
  FaCommentDots,
  FaTrophy,
  FaCoins,
  FaStar,
  FaBookOpen,
  FaGraduationCap,
  FaStore,
  FaEnvelope,
  FaPlusCircle
} from 'react-icons/fa';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingsTable } from '@/components/bookings/bookings-table';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import MessageIndicator from '@/components/message-indicator';

interface Booking {
  id: string;
  date: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  studentName: string;
  instructorName?: string;
  price: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Credit {
  id: string;
  type: string;
  amount: number;
  expiresAt?: string;
  used: number;
  remaining: number;
  lessonTypeId?: string;
  lessonTypeName?: string | null;
  creditsRemaining?: number;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  date: string;
}

interface Stats {
  totalLessons?: number;
  completedLessons?: number;
  upcomingLessons?: number;
  credits?: number;
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  totalCredits: number;
}

interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  avatar?: string;
}

interface StudentDashboardClientProps {
  user: User;
  bookings: Booking[];
  credits: Credit[];
  feedback: Feedback[];
  stats: Stats;
}

const StudentDashboardClient: React.FC<StudentDashboardClientProps> = ({ 
  user, 
  bookings: initialBookings, 
  credits, 
  feedback, 
  stats 
}) => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [processingCreditPayment, setProcessingCreditPayment] = useState<Record<string, boolean>>({});

  const upcomingBookings = bookings.filter(
    (booking) => booking.status !== 'cancelled' && booking.status !== 'completed'
  );

  const pastBookings = bookings.filter(
    (booking) => booking.status === 'cancelled' || booking.status === 'completed'
  );

  const refreshBookings = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/bookings/my-bookings');
      if (!response.ok) {
        throw new Error('Kunde inte hämta bokningar');
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error refreshing bookings:', error);
      toast.error('Kunde inte uppdatera bokningar');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'} />
    ));
  };

  const handleCreditPayment = async (bookingId: string, lessonTypeId: string) => {
    if (processingCreditPayment[bookingId]) return;
    
    setProcessingCreditPayment(prev => ({ ...prev, [bookingId]: true }));
    try {
      const response = await fetch(`/api/bookings/${bookingId}/pay-with-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          userId: user.id,
          lessonTypeId,
        }),
      });

      if (response.ok) {
        toast.success('Betalning med krediter lyckades!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Kunde inte behandla kreditbetalning');
      }
    } catch (error) {
      console.error('Error processing credit payment:', error);
      toast.error('Ett fel inträffade vid betalning med krediter');
    } finally {
      setProcessingCreditPayment(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const hasCreditsForLesson = (lessonTypeId: string) => {
    return credits.some((c: any) => c.lessonTypeId === lessonTypeId && c.creditsRemaining > 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-6 shadow-lg mb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <FaGraduationCap className="text-yellow-300" />
              Studentsidan
            </h1>
            <p className="text-xl mt-2 text-blue-100">Välkommen tillbaka, {user.firstName} {user.lastName}!</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">Din framsteg</div>
            <div className="text-2xl font-bold">{stats.completedBookings}/{stats.totalBookings}</div>
          </div>
        </div>

        <div className="mt-4">
          <nav className="flex justify-center gap-4 text-lg font-semibold">
            <Link href="/dashboard/student" className="hover:text-yellow-300">Bokningar</Link>
            <Link href="/dashboard/student/feedback" className="hover:text-yellow-300">Feedback</Link>
            <MessageIndicator href="/dashboard/student/meddelande" className="hover:text-yellow-300">
              Meddelande
            </MessageIndicator>
            <Link href="/dashboard/student/settings" className="hover:text-yellow-300">Inställningar</Link>
            <Link href="/dashboard/utbildningskort" className="hover:text-yellow-300">Utbildningskort</Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt Lektioner</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
              </div>
              <FaBookOpen className="text-4xl text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Genomförda</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kommande</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.upcomingBookings}</p>
              </div>
              <FaClock className="text-4xl text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tillgängliga Krediter</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalCredits}</p>
              </div>
              <FaCoins className="text-4xl text-purple-500" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Översikt av dina lektioner</h2>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={refreshBookings} disabled={isRefreshing}>
                {isRefreshing ? 'Uppdaterar...' : 'Uppdatera'}
              </Button>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-white border-b border-gray-100 rounded-t-xl">
              <CardTitle className="text-2xl font-bold text-gray-900">Mina Bokningar</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Hantera dina kommande och tidigare lektioner smidigt och enkelt
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
                <TabsList className="flex-nowrap overflow-x-auto">
                  <TabsTrigger value="upcoming">Kommande</TabsTrigger>
                  <TabsTrigger value="past">Tidigare</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  {upcomingBookings.length > 0 ? (
                    <BookingsTable 
                      bookings={upcomingBookings} 
                      userRole={user.role} 
                      onRefresh={refreshBookings}
                      compact={true}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Inga kommande lektioner hittades</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => router.push('/book')}
                      >
                        Boka lektion nu
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="past">
                  {pastBookings.length > 0 ? (
                    <BookingsTable 
                      bookings={pastBookings} 
                      userRole={user.role}
                      onRefresh={refreshBookings}
                      compact={true}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Inga tidigare lektioner hittades</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FaCoins className="text-yellow-500" />
              Dina Krediter
            </h3>
            
            {credits.length > 0 ? (
              <div className="space-y-3">
                {credits.map((credit) => (
                  <div key={credit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      {credit.lessonTypeName === null ? 'Handledarutbildning' : credit.lessonTypeName}
                    </span>
                    <span className="font-bold text-purple-600">{credit.creditsRemaining || credit.remaining}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Inga krediter tillgängliga</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboardClient;
