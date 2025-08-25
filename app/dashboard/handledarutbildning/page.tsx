'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SupervisorSelection } from '@/components/booking/supervisor-selection';
import { ArrowLeft, Users, Calendar, Clock, MapPin } from 'lucide-react';

// TypeScript interfaces
interface HandledarSession {
  id: string;
  title: string;
  formattedDateTime: string;
  spotsLeft: number;
  pricePerParticipant: number;
  teacherName: string;
}

interface Supervisor {
  id?: string;
  name: string;
  email: string;
  phone: string;
  personalNumber: string;
}

interface BookingData {
  studentId: string;
  supervisors: Supervisor[];
  totalPrice: number;
  participantCount: number;
}

export default function HandledarkursBookingPage() {
  const { user, isLoading } = useAuth();
  const [sessions, setSessions] = useState<HandledarSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<HandledarSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [showSupervisorForm, setShowSupervisorForm] = useState<boolean>(false);
  const [bookingMessage, setBookingMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      fetchSessions();
    }
  }, [isLoading]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/handledar-sessions');
      if (!response.ok) throw new Error('Kunde inte hämta sessioner');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Fel vid hämtning av sessioner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session: HandledarSession): void => {
    setSelectedSession(session);
    setShowSupervisorForm(true);
  };

  const handleBackToSessions = (): void => {
    setShowSupervisorForm(false);
    setSelectedSession(null);
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const price = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('sv-SE').format(price);
  };



  const handleSupervisorComplete = async (data: BookingData) => {
    if (!selectedSession) {
      setBookingMessage('Vänligen välj en session att boka.');
      return;
    }

    setBookingLoading(true);
    try {
      // Convert Supervisor format to the API expected format
      const supervisors = data.supervisors.map(supervisor => ({
        supervisorName: supervisor.name,
        supervisorEmail: supervisor.email,
        supervisorPhone: supervisor.phone,
        supervisorPersonalNumber: supervisor.personalNumber
      }));

      const response = await fetch(`/api/handledar-sessions/${selectedSession.id}/book-with-supervisors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          studentId: data.studentId,
          supervisors: supervisors
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Bokning misslyckades');

      setBookingMessage(`Bokning lyckades! Totalt pris: ${result.totalPrice} SEK. Betalning krävs för att bekräfta bokningen.`);

      // Redirect to first booking payment page
      if (result.bookingIds && result.bookingIds.length > 0) {
        setTimeout(() => {
          router.push(`/handledar/payment/${result.bookingIds[0]}`);
        }, 3000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setBookingMessage(`Fel: ${errorMessage}`);
      console.error('Fel vid skapande av bokning:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full px-4 md:px-6 py-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Boka Handledarkurs
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed">
            Välj en kurs och lägg till handledare
          </p>
        </div>

        {bookingMessage && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium text-center">{bookingMessage}</p>
          </div>
        )}

        {!showSupervisorForm ? (
          /* Session Selection */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer" onClick={() => handleSessionSelect(session)}>
                <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                        {session.title}
                      </CardTitle>
                      <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                        {session.formattedDateTime}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Users className="w-4 h-4" />
                      {session.spotsLeft} platser kvar
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Calendar className="w-4 h-4" />
                      {session.teacherName}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4" />
                      {formatCurrency(session.pricePerParticipant)} SEK
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSessionSelect(session);
                    }}
                  >
                    Välj kurs
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Supervisor Selection Form */
          <div className="max-w-4xl mx-auto">
            {/* Selected Session Info */}
            {selectedSession && (
              <Card className="mb-6 shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
                <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {selectedSession.title}
                      </CardTitle>
                      <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                        {selectedSession.formattedDateTime}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleBackToSessions}
                      className="bg-white/50 hover:bg-white/70"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Ändra kurs
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Supervisor Selection Component */}
            {selectedSession && (
              <SupervisorSelection
                sessionType="handledarutbildning"
                basePrice={selectedSession.pricePerParticipant}
                pricePerSupervisor={selectedSession.pricePerParticipant}
                sessionCapacity={{
                  maxParticipants: selectedSession.spotsLeft + (selectedSession.spotsLeft === 0 ? 0 : 1), // Current participants + available spots
                  currentParticipants: selectedSession.spotsLeft === 0 ? 0 : 1 // Estimate based on spots left
                }}
                onComplete={handleSupervisorComplete}
                onBack={handleBackToSessions}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
