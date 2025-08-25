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
import { Button as FlowbiteButton } from 'flowbite-react';
import { Card as FlowbiteCard } from 'flowbite-react';
import { Tabs as FlowbiteTabs } from 'flowbite-react';
import { Table as FlowbiteTable } from 'flowbite-react';
import { Badge as FlowbiteBadge } from 'flowbite-react';
import { Modal as FlowbiteModal } from 'flowbite-react';
import { Toast as FlowbiteToast } from 'flowbite-react';
import { Navbar as FlowbiteNavbar } from 'flowbite-react';
import { Breadcrumb as FlowbiteBreadcrumb } from 'flowbite-react';
import { Alert as FlowbiteAlert } from 'flowbite-react';
import { Dropdown as FlowbiteDropdown } from 'flowbite-react';
import { Avatar as FlowbiteAvatar } from 'flowbite-react';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Flowbite Navbar Header */}
      <FlowbiteNavbar fluid className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center">
          <FaGraduationCap className="text-blue-600 text-2xl mr-3" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">Studentsidan</span>
      </div>

        <div className="flex items-center gap-3">
          <FlowbiteButton color="light" size="sm" as={Link} href="/dashboard/student">
            Bokningar
          </FlowbiteButton>
          <FlowbiteButton color="light" size="sm" as={Link} href="/dashboard/student/feedback">
            Feedback
          </FlowbiteButton>
          <FlowbiteButton color="light" size="sm" as={Link} href="/dashboard/settings">
            Inställningar
          </FlowbiteButton>

          {/* User Dropdown Menu */}
          <FlowbiteDropdown
            arrowIcon={false}
            inline
            label={
              <FlowbiteAvatar
                alt={`${user.firstName} ${user.lastName}`}
                img={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=3b82f6&color=fff`}
                rounded
                size="sm"
              />
            }
          >
            <FlowbiteDropdown.Header>
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </span>
              <span className="block truncate text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </span>
            </FlowbiteDropdown.Header>
            <FlowbiteDropdown.Item as={Link} href="/dashboard/settings">
              Inställningar
            </FlowbiteDropdown.Item>
            <FlowbiteDropdown.Item as={Link} href="/dashboard/student/feedback">
              Feedback
            </FlowbiteDropdown.Item>
            <FlowbiteDropdown.Divider />
            <FlowbiteDropdown.Item as={Link} href="/inloggning">
              Logga ut
            </FlowbiteDropdown.Item>
          </FlowbiteDropdown>
        </div>
      </FlowbiteNavbar>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards with Flowbite */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FlowbiteCard className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Totalt lektioner</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FaBookOpen className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </FlowbiteCard>

          <FlowbiteCard className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Genomförda</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completedBookings}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <FaCheckCircle className="text-2xl text-green-600 dark:text-green-400" />
              </div>
            </div>
          </FlowbiteCard>

          <FlowbiteCard className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kommande</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingBookings}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <FaClock className="text-2xl text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </FlowbiteCard>

          <FlowbiteCard className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tillgängliga krediter</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCredits}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <FaCoins className="text-2xl text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </FlowbiteCard>
        </div>

        {/* Bookings Section with Flowbite */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mina bokningar</h2>
            <FlowbiteButton
              color="light"
              size="sm"
              onClick={refreshBookings}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
                {isRefreshing ? 'Uppdaterar...' : 'Uppdatera'}
            </FlowbiteButton>
          </div>

          <FlowbiteCard className="shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Översikt</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hantera kommande och tidigare lektioner</p>
              </div>

              <FlowbiteTabs aria-label="Bookings tabs">
                <FlowbiteTabs.Item active={activeTab === 'upcoming'} title="Kommande">
                  {upcomingBookings.length > 0 ? (
                    <div className="mt-4">
                      {/* Flowbite Table Demo */}
                      <div className="overflow-x-auto">
                        <FlowbiteTable hoverable className="shadow-sm">
                          <FlowbiteTable.Head>
                            <FlowbiteTable.HeadCell>Datum</FlowbiteTable.HeadCell>
                            <FlowbiteTable.HeadCell>Tid</FlowbiteTable.HeadCell>
                            <FlowbiteTable.HeadCell>Typ</FlowbiteTable.HeadCell>
                            <FlowbiteTable.HeadCell>Status</FlowbiteTable.HeadCell>
                            <FlowbiteTable.HeadCell>Pris</FlowbiteTable.HeadCell>
                            <FlowbiteTable.HeadCell>Åtgärder</FlowbiteTable.HeadCell>
                          </FlowbiteTable.Head>
                          <FlowbiteTable.Body className="divide-y">
                            {upcomingBookings.slice(0, 5).map((booking) => (
                              <FlowbiteTable.Row key={booking.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                <FlowbiteTable.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                  {format(new Date(booking.date), 'yyyy-MM-dd', { locale: sv })}
                                </FlowbiteTable.Cell>
                                <FlowbiteTable.Cell>{booking.time}</FlowbiteTable.Cell>
                                <FlowbiteTable.Cell>{booking.type}</FlowbiteTable.Cell>
                                <FlowbiteTable.Cell>
                                  <FlowbiteBadge
                                    color={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'failure'}
                                  >
                                    {booking.status === 'confirmed' ? 'Bekräftad' :
                                     booking.status === 'pending' ? 'Väntar' : 'Avbokad'}
                                  </FlowbiteBadge>
                                </FlowbiteTable.Cell>
                                <FlowbiteTable.Cell>{booking.price} kr</FlowbiteTable.Cell>
                                <FlowbiteTable.Cell>
                                  <FlowbiteButton size="sm" color="light" onClick={() => router.push(`/bokningar/${booking.id}`)}>
                                    Visa
                                  </FlowbiteButton>
                                </FlowbiteTable.Cell>
                              </FlowbiteTable.Row>
                            ))}
                          </FlowbiteTable.Body>
                        </FlowbiteTable>
                      </div>

                      {/* Show full BookingsTable if more than 5 bookings */}
                      {upcomingBookings.length > 5 && (
                        <div className="mt-4">
                    <BookingsTable 
                      bookings={upcomingBookings} 
                      userRole={user.role} 
                      onRefresh={refreshBookings}
                      compact={true}
                    />
                        </div>
                      )}
                        </div>
                      ) : (
                    <div className="text-center py-8">
                      <FaBookOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Inga kommande lektioner</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {openingBooking ? 'Öppnar bokning...' : 'Börja med att boka en lektion'}
                      </p>
                      {!openingBooking && (
                        <div className="mt-6">
                          <FlowbiteButton
                            color="blue"
                          onClick={() => { setOpeningBooking(true); router.push('/boka-korning') }}
                        >
                          Boka lektion nu
                          </FlowbiteButton>
                        </div>
                      )}
                    </div>
                  )}
                </FlowbiteTabs.Item>

                <FlowbiteTabs.Item active={activeTab === 'past'} title="Tidigare">
                  {pastBookings.length > 0 ? (
                    <div className="mt-4">
                    <BookingsTable 
                      bookings={pastBookings} 
                      userRole={user.role}
                      onRefresh={refreshBookings}
                      compact={true}
                    />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaCheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Inga tidigare lektioner</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Dina genomförda lektioner visas här</p>
                    </div>
                  )}
                </FlowbiteTabs.Item>
              </FlowbiteTabs>
            </div>
          </FlowbiteCard>

          {/* Credits and Packages Section with Flowbite */}
          <FlowbiteCard className="shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FaCoins className="text-yellow-500 text-xl" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dina krediter och paket</h3>
                </div>
                <FlowbiteButton
                  color="blue"
                  onClick={() => setShowPackageModal(true)}
                >
                  Köp paket
                </FlowbiteButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                    Krediter
                  </h4>
                {credits.length > 0 ? (
                  <div className="space-y-3">
                    {credits.map((credit: any) => (
                        <FlowbiteCard key={credit.id} className="border-l-4 border-l-purple-500">
                          <div className="flex justify-between items-center p-3">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {credit.lessonTypeName === null ? 'Handledarutbildning' : credit.lessonTypeName}
                        </span>
                            <FlowbiteBadge color="purple" className="font-semibold">
                              {credit.creditsRemaining || credit.remaining}
                            </FlowbiteBadge>
                      </div>
                        </FlowbiteCard>
                    ))}
                  </div>
                ) : (
                    <FlowbiteAlert color="gray" className="text-center">
                      <span className="font-medium">Inga krediter tillgängliga</span>
                    </FlowbiteAlert>
                )}
              </div>

              <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                    Aktiva paket
                  </h4>
                {userPackages.length > 0 ? (
                  <div className="space-y-3">
                    {userPackages.map((pkg) => (
                        <FlowbiteCard key={pkg.id} className="border-l-4 border-l-blue-500">
                          <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {pkg.name || 'Paket'}
                                </div>
                            {pkg.purchaseDate && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Köpt: {new Date(pkg.purchaseDate).toLocaleDateString('sv-SE')}
                                  </div>
                            )}
                          </div>
                          {typeof pkg.pricePaid !== 'undefined' && (
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {Number(pkg.pricePaid).toLocaleString('sv-SE')} kr
                                </div>
                          )}
                        </div>
                      </div>
                        </FlowbiteCard>
                    ))}
                  </div>
                ) : (
                    <FlowbiteAlert color="gray" className="text-center">
                      <span className="font-medium">Inga aktiva paket</span>
                    </FlowbiteAlert>
                  )}
                  </div>
              </div>
            </div>
          </FlowbiteCard>

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

      {/* Flowbite Modal Demo - Package Store */}
      <FlowbiteModal show={showPackageModal} onClose={() => setShowPackageModal(false)} size="lg">
        <FlowbiteModal.Header>Paketbutik</FlowbiteModal.Header>
        <FlowbiteModal.Body>
          <div className="space-y-6">
            <FlowbiteAlert color="info">
              <span className="font-medium">Välkommen till paketbutiken!</span>
              Köp lektionspaket för att spara pengar och få tillgång till fler funktioner.
            </FlowbiteAlert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FlowbiteCard className="border-l-4 border-l-blue-500">
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Grundpaket</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">5 lektioner</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">1 250 kr</p>
                  <FlowbiteButton color="blue" className="w-full mt-4">
                    Köp paket
                  </FlowbiteButton>
                </div>
              </FlowbiteCard>

              <FlowbiteCard className="border-l-4 border-l-green-500">
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Premiumpaket</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">10 lektioner</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">2 200 kr</p>
                  <FlowbiteButton color="green" className="w-full mt-4">
                    Köp paket
                  </FlowbiteButton>
                </div>
              </FlowbiteCard>
            </div>
          </div>
        </FlowbiteModal.Body>
        <FlowbiteModal.Footer>
          <FlowbiteButton color="gray" onClick={() => setShowPackageModal(false)}>
            Avbryt
          </FlowbiteButton>
          <FlowbiteButton color="blue" onClick={() => {
            toast.success('Paketbutik - Kommer snart!');
            setShowPackageModal(false);
          }}>
            Fortsätt till betalning
          </FlowbiteButton>
        </FlowbiteModal.Footer>
      </FlowbiteModal>

      {/* Flowbite Alert Demo - Status Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {openingBooking && (
          <FlowbiteAlert color="info" className="mb-2" onDismiss={() => setOpeningBooking(false)}>
            <span className="font-medium">Öppnar bokning...</span>
          </FlowbiteAlert>
        )}
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
