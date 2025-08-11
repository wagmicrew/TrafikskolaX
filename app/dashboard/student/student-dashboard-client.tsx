"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaCheckCircle, 
  FaClock, 
  FaCoins,
  FaStar,
  FaBookOpen,
  FaGraduationCap,
} from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingsTable } from '@/components/bookings/bookings-table';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import MessageIndicator from '@/components/message-indicator';
import LearningModules from './LearningModules';
import StudentStrengthsCard from './StudentStrengthsCard';
import StudentHeader from './StudentHeader';
import PackageStoreModal from '@/components/PackageStoreModal';
import { SwishPaymentDialog } from '@/components/booking/swish-payment-dialog';
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog';

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

interface UserPackage {
  id: string;
  packageId: string;
  name?: string;
  description?: string;
  purchaseDate?: string;
  pricePaid?: number;
}

interface StudentDashboardClientProps {
  user: User;
  bookings: Booking[];
  credits: Credit[];
  userPackages?: UserPackage[];
  feedback: Feedback[];
  stats: Stats;
}

const StudentDashboardClient: React.FC<StudentDashboardClientProps> = ({ 
  user, 
  bookings: initialBookings, 
  credits, 
  userPackages = [],
  feedback, 
  stats 
}) => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [processingCreditPayment, setProcessingCreditPayment] = useState<Record<string, boolean>>({});
  const [confirmUseCreditsFor, setConfirmUseCreditsFor] = useState<{ bookingId: string, lessonTypeId: string } | null>(null)
  const [openingBooking, setOpeningBooking] = useState(false)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showSwishDialog, setShowSwishDialog] = useState(false)
  const [showQliroDialog, setShowQliroDialog] = useState(false)
  const [swishPaymentData, setSwishPaymentData] = useState({ amount: 0, message: '', purchaseId: '' })
  const [qliroPaymentData, setQliroPaymentData] = useState({ amount: 0, purchaseId: '', checkoutUrl: '' })

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
      setConfirmUseCreditsFor(null)
    }
  };

  const hasCreditsForLesson = (lessonTypeId: string) => {
    return credits.some((c: any) => c.lessonTypeId === lessonTypeId && c.creditsRemaining > 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="px-6 pt-8">
        <StudentHeader title="Studentsidan" icon={<FaGraduationCap className="text-yellow-300" />} />
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Totalt lektioner</p>
                <p className="text-3xl font-extrabold">{stats.totalBookings}</p>
              </div>
              <FaBookOpen className="text-3xl text-sky-300" />
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Genomförda</p>
                <p className="text-3xl font-extrabold">{stats.completedBookings}</p>
              </div>
              <FaCheckCircle className="text-3xl text-emerald-300" />
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Kommande</p>
                <p className="text-3xl font-extrabold">{stats.upcomingBookings}</p>
              </div>
              <FaClock className="text-3xl text-yellow-300" />
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Tillgängliga krediter</p>
                <p className="text-3xl font-extrabold">{stats.totalCredits}</p>
              </div>
              <FaCoins className="text-3xl text-purple-300" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-white">Mina bokningar</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshBookings} disabled={isRefreshing} className="border-white/20 text-white hover:bg-white/10">
                {isRefreshing ? 'Uppdaterar...' : 'Uppdatera'}
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Översikt</CardTitle>
              <CardDescription className="text-slate-300">Hantera kommande och tidigare lektioner</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10">
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
                    <div className="text-center py-8 text-slate-300">
                      <p>Inga kommande lektioner hittades</p>
                      {openingBooking ? (
                        <div className="mt-4 flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-sky-500"></div>
                          <div className="text-sm text-slate-200">Öppnar bokning...</div>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="mt-4 border-white/20 text-white hover:bg-white/10"
                          onClick={() => { setOpeningBooking(true); router.push('/boka-korning') }}
                        >
                          Boka lektion nu
                        </Button>
                      )}
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
                    <div className="text-center py-8 text-slate-300">
                      <p>Inga tidigare lektioner hittades</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold flex items-center gap-2">
                <FaCoins className="text-yellow-300" /> Dina krediter och paket
              </h3>
              <Button onClick={() => setShowPackageModal(true)} className="bg-sky-600 hover:bg-sky-500">Köp paket</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm uppercase tracking-wide text-slate-300 mb-2">Krediter</h4>
                {credits.length > 0 ? (
                  <div className="space-y-3">
                    {credits.map((credit: any) => (
                      <div key={credit.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-sm">
                          {credit.lessonTypeName === null ? 'Handledarutbildning' : credit.lessonTypeName}
                        </span>
                        <span className="font-bold text-purple-300">{credit.creditsRemaining || credit.remaining}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                    Inga krediter tillgängliga
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm uppercase tracking-wide text-slate-300 mb-2">Aktiva paket</h4>
                {userPackages.length > 0 ? (
                  <div className="space-y-3">
                    {userPackages.map((pkg) => (
                      <div key={pkg.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{pkg.name || 'Paket'}</div>
                            {pkg.purchaseDate && (
                              <div className="text-xs text-slate-300">Köpt: {new Date(pkg.purchaseDate).toLocaleDateString('sv-SE')}</div>
                            )}
                          </div>
                          {typeof pkg.pricePaid !== 'undefined' && (
                            <div className="text-sm text-slate-200">{Number(pkg.pricePaid).toLocaleString('sv-SE')} kr</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                    Inga aktiva paket
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strengths vs Needs Work */}
          <StudentStrengthsCard />

          {/* Learning modules/progress */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold">Lärande</h3>
              <Button onClick={() => toast('Kommer snart: fler moduler!')} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white">Visa alla</Button>
            </div>
            <LearningModules userId={user.id} />
          </div>
        </div>
      </div>

      {/* Confirm use credits dialog */}
      {confirmUseCreditsFor && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setConfirmUseCreditsFor(null)} />
          <div className="relative z-[11010] rounded-2xl bg-slate-900/95 border border-white/10 text-white shadow-2xl p-6 w-[min(92vw,480px)]">
            <h4 className="text-lg font-extrabold mb-2">Använd krediter?</h4>
            <p className="text-slate-300 mb-4">Vill du använda dina krediter för att betala denna bokning?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={()=>setConfirmUseCreditsFor(null)}>Avbryt</Button>
              <Button onClick={()=>handleCreditPayment(confirmUseCreditsFor.bookingId, confirmUseCreditsFor.lessonTypeId)} className="bg-emerald-600 hover:bg-emerald-500">Använd krediter</Button>
            </div>
          </div>
        </div>
      )}

      {/* Package Store Modal */}
      <PackageStoreModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        userRole={user.role}
        hasActivePackage={(userPackages || []).length > 0}
        onStartPayment={(args) => {
          if (args.method === 'swish') {
            setSwishPaymentData({ amount: args.amount, message: args.message, purchaseId: args.purchaseId })
            setShowSwishDialog(true)
          } else {
            setQliroPaymentData({ amount: args.amount, purchaseId: args.purchaseId, checkoutUrl: args.checkoutUrl })
            setShowQliroDialog(true)
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
    </div>
  );
};

export default StudentDashboardClient;
