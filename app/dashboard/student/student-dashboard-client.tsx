"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  Coins,
  BookOpen,
  RefreshCw,
  Package,
  MessageSquare,
  Receipt,
  FileText,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingsTable } from '@/components/bookings/bookings-table';
import { Badge } from 'flowbite-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import LearningModules from './LearningModules';
import StudentStrengthsCard from './StudentStrengthsCard';
import PackageStoreModal from '@/components/PackageStoreModal';
import { SwishPaymentDialog } from '@/components/booking/swish-payment-dialog';
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog';
import StudentHeader from './StudentHeader';
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
  invoices: any[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    upcomingBookings: number;
    totalCredits: number;
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
    totalInvoiceAmount: number;
  };
}

const StudentDashboardClient: React.FC<StudentDashboardClientProps> = ({
  user,
  bookings: initialBookings,
  credits: initialCredits,
  packages: initialPackages,
  userPackages: initialUserPackages,
  invoices: initialInvoices,
  stats
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

  const calculatedStats = {
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <StudentHeader
        userName={user.firstName}
        title="Elevöversikt"
        icon={<BookOpen className="w-5 h-5" />}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Totalt lektioner</p>
                <p className="text-3xl font-bold text-gray-900">{calculatedStats.totalBookings}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="text-2xl text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Genomförda lektioner</p>
                <p className="text-3xl font-bold text-gray-900">{calculatedStats.completedBookings}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="text-2xl text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Kommande lektioner</p>
                <p className="text-3xl font-bold text-gray-900">{calculatedStats.upcomingBookings}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="text-2xl text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tillgängliga krediter</p>
                <p className="text-3xl font-bold text-gray-900">{calculatedStats.totalCredits}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Coins className="text-2xl text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Section */}
        <div className="mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">Mina bokningar</CardTitle>
                  <CardDescription className="text-gray-600">
                    Hantera dina kommande och genomförda lektioner
                  </CardDescription>
                </div>
                <Button
                  onClick={refreshBookings}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uppdaterar...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Uppdatera
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <BookingsTable bookings={transformedBookings} userRole="student" />
            </CardContent>
          </Card>
        </div>

        {/* Credits Section */}
        {credits.length > 0 && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Coins className="w-6 h-6 mr-2 text-purple-600" />
                  Dina krediter
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Använd dina krediter för att boka lektioner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {credits.map((credit) => (
                    <div key={credit.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{credit.packageName}</h4>
                        <Badge className="bg-purple-100 text-purple-800">
                          {credit.creditsRemaining} krediter
                        </Badge>
                      </div>
                      <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                        <Link href="/boka">
                          <Calendar className="w-4 h-4 mr-2" />
                          Boka nu
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Boka lektion</h3>
              <p className="text-sm text-gray-600 mb-4">Boka ny körlektion online</p>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/boka">Boka nu</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Paketbutik</h3>
              <p className="text-sm text-gray-600 mb-4">Köp körlektioner till bättre pris</p>
              <Button
                onClick={() => setShowPackageModal(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Öppna butik
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Feedback</h3>
              <p className="text-sm text-gray-600 mb-4">Se lärarens kommentarer</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/student/feedback">Visa feedback</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mina fakturor</h3>
              <p className="text-sm text-gray-600 mb-4">
                {stats.pendingInvoices > 0
                  ? `${stats.pendingInvoices} väntande fakturor`
                  : 'Hantera dina fakturor'
                }
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/student/fakturor">Visa fakturor</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Learning Modules and Strengths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Lärande & Framsteg</CardTitle>
              <CardDescription className="text-gray-600">
                Dina lärandemoduler och styrkor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LearningModules userId={user.id} />
            </CardContent>
          </Card>

          <StudentStrengthsCard />
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
