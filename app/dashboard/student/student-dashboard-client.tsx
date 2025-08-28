"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCheckCircle,
  FaClock,
  FaCoins,
  FaBookOpen,
} from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingsTable } from '@/components/bookings/bookings-table';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import LearningModules from './LearningModules';
import StudentStrengthsCard from './StudentStrengthsCard';
import PackageStoreModal from '@/components/PackageStoreModal';
import { SwishPaymentDialog } from '@/components/booking/swish-payment-dialog';
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog';
import MobileBottomNavigation from '@/components/ui/mobile-bottom-navigation';

interface StudentBooking {
  id: string;
  date: string;
  time: string;
  lessonType: string;
  instructor: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  price: number;
}

interface BookingsTableBooking {
  id: string;
  date: string;
  time: string;
  type: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  paymentStatus: "paid" | "unpaid" | "partial";
  studentName: string;
  instructorName?: string;
  vehicle?: string;
  notes?: string;
  price: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface Credit {
  id: string;
  lessonTypeId: string;
  creditsRemaining: number;
  packageName: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
  credits: number;
  lessonTypeId: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface StudentDashboardClientProps {
  user: User;
  bookings: StudentBooking[];
  credits: Credit[];
  packages: Package[];
  userPackages: any[];
}

const StudentDashboardClient: React.FC<StudentDashboardClientProps> = ({
  user,
  bookings: initialBookings,
  credits: initialCredits,
  packages: initialPackages,
  userPackages: initialUserPackages
}) => {
  const router = useRouter();
  const [bookings, setBookings] = useState<StudentBooking[]>(initialBookings);
  const [credits, setCredits] = useState<Credit[]>(initialCredits);
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [userPackages, setUserPackages] = useState(initialUserPackages);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showSwishDialog, setShowSwishDialog] = useState(false);
  const [showQliroDialog, setShowQliroDialog] = useState(false);
  const [swishPaymentData, setSwishPaymentData] = useState<any>({});
  const [qliroPaymentData, setQliroPaymentData] = useState<any>({});

  // Transform bookings data to match BookingsTable interface
  const transformedBookings: BookingsTableBooking[] = bookings.map(booking => ({
    id: booking.id,
    date: booking.date,
    time: booking.time,
    type: booking.lessonType,
    status: booking.status as "confirmed" | "pending" | "cancelled" | "completed",
    paymentStatus: "paid" as const, // Default to paid, adjust based on actual logic
    studentName: `${user.firstName} ${user.lastName}`,
    instructorName: booking.instructor,
    vehicle: undefined,
    notes: undefined,
    price: booking.price,
    paidAmount: booking.price,
    createdAt: new Date().toISOString(), // Default value
    updatedAt: new Date().toISOString()  // Default value
  }));

  const stats = {
    totalBookings: bookings.length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    upcomingBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
    totalCredits: credits.reduce((sum, c) => sum + c.creditsRemaining, 0)
  };

  const refreshBookings = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/student/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        toast.success('Bokningar uppdaterade');
      }
    } catch (error) {
      toast.error('Kunde inte uppdatera bokningar');
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasCreditsForLesson = (lessonTypeId: string) => {
    return credits.some((c: any) => c.lessonTypeId === lessonTypeId && c.creditsRemaining > 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Välkommen, {user.firstName}!
            </h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/student/bookings">Bokningar</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/student/feedback">Feedback</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings">Inställningar</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardContent className="flex items-center justify-between p-4 md:p-6">
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Totalt lektioner</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FaBookOpen className="text-xl md:text-2xl text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4 md:p-6">
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Genomförda</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats.completedBookings}</p>
              </div>
              <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <FaCheckCircle className="text-xl md:text-2xl text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4 md:p-6">
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Kommande</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingBookings}</p>
              </div>
              <div className="p-2 md:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <FaClock className="text-xl md:text-2xl text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4 md:p-6">
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Tillgängliga krediter</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCredits}</p>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <FaCoins className="text-xl md:text-2xl text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Mina bokningar</h2>
            <Button
              onClick={refreshBookings}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              {isRefreshing ? 'Uppdaterar...' : 'Uppdatera'}
            </Button>
          </div>

          <Card>
            <CardContent className="p-3 md:p-6">
              <BookingsTable bookings={transformedBookings} userRole="student" />
            </CardContent>
          </Card>
        </div>

        {/* Learning Modules and Strengths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">Lärande</CardTitle>
              <CardDescription className="text-sm">Dina framsteg och moduler</CardDescription>
            </CardHeader>
            <CardContent>
              <LearningModules userId={user.id} />
            </CardContent>
          </Card>

          <StudentStrengthsCard />
        </div>

        {/* Package Store Button */}
        <div className="text-center pb-20 md:pb-0">
          <Button
            onClick={() => setShowPackageModal(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base px-6 md:px-8 py-2 md:py-3"
          >
            Öppna Paketbutik
          </Button>
        </div>
      </div>

      {/* Package Store Modal */}
      <PackageStoreModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        userRole="student"
        onStartPayment={(args: any) => {
          if (args.method === 'swish') {
            setSwishPaymentData({ amount: args.amount, purchaseId: args.purchaseId, message: args.message });
            setShowSwishDialog(true);
          } else {
            setQliroPaymentData({ amount: args.amount, purchaseId: args.purchaseId, checkoutUrl: args.checkoutUrl });
            setShowQliroDialog(true);
          }
        }}
      />

      {/* Payment dialogs */}
      <SwishPaymentDialog
        isOpen={showSwishDialog}
        onClose={() => setShowSwishDialog(false)}
        booking={{ id: swishPaymentData.purchaseId, totalPrice: swishPaymentData.amount }}
        onConfirm={() => setShowSwishDialog(false)}
        customMessage={swishPaymentData.message}
      />
      <QliroPaymentDialog
        isOpen={showQliroDialog}
        onClose={() => setShowQliroDialog(false)}
        purchaseId={qliroPaymentData.purchaseId}
        amount={qliroPaymentData.amount}
        checkoutUrl={qliroPaymentData.checkoutUrl}
        onConfirm={() => setShowQliroDialog(false)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation userRole="student" />
    </div>
  );
};

export default StudentDashboardClient;
