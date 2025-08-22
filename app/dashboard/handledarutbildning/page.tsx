'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function HandledarkursBookingPage() {
  const { user, isLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [participants, setParticipants] = useState([{ supervisorName: '', supervisorEmail: '', supervisorPhone: '' }]);
  const [loading, setLoading] = useState(true);
  const [bookingMessage, setBookingMessage] = useState('');
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

  const handleSessionSelect = (session) => setSelectedSession(session);

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index][field] = value;
    setParticipants(updatedParticipants);
  };

  const addParticipant = () => setParticipants([...participants, { supervisorName: '', supervisorEmail: '', supervisorPhone: '' }]);

  const removeParticipant = (index) => {
    const updatedParticipants = participants.filter((_, i) => i !== index);
    setParticipants(updatedParticipants);
  };

  const handleBooking = async () => {
    if (!selectedSession) {
      setBookingMessage('Vänligen välj en session att boka.');
      return;
    }

    try {
      const response = await fetch(`/api/handledar-sessions/${selectedSession.id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ participants }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setBookingMessage(`Bokning lyckades! Totalt pris: ${data.totalPrice}. Betalning krävs för att bekräfta bokningen.`);
      setParticipants([{ supervisorName: '', supervisorEmail: '', supervisorPhone: '' }]);
      setSelectedSession(null);

      // Redirect to payment or confirmation page
      setTimeout(() => {
        router.push('/payment');
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setBookingMessage(`Fel: ${errorMessage}`);
      console.error('Fel vid skapande av bokning:', error);
    }
  };

  if (loading || isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Boka Handledarkurs</h1>

      {bookingMessage && <p className="mb-4 text-center text-green-500">{bookingMessage}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {sessions.map((session) => (
          <Card key={session.id} className={`cursor-pointer ${selectedSession?.id === session.id ? 'bg-blue-100' : ''}`} onClick={() => handleSessionSelect(session)}>
            <CardHeader>
              <CardTitle>{session.title}</CardTitle>
              <p className="text-sm text-gray-500">{session.formattedDateTime}</p>
            </CardHeader>
            <CardContent>
              <p>Lediga platser: {session.spotsLeft}</p>
              <p>Pris per deltagare: {session.pricePerParticipant}</p>
              <p>{session.teacherName}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSession && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Lägg till deltagare</h2>

          {participants.map((participant, index) => (
            <div key={index} className="flex space-x-4 mb-4">
              <Input placeholder="Namn" value={participant.supervisorName} onChange={(e) => handleParticipantChange(index, 'supervisorName', e.target.value)} />
              <Input placeholder="E-post" value={participant.supervisorEmail} onChange={(e) => handleParticipantChange(index, 'supervisorEmail', e.target.value)} />
              <Input placeholder="Telefon" value={participant.supervisorPhone} onChange={(e) => handleParticipantChange(index, 'supervisorPhone', e.target.value)} />
              {participants.length > 1 && (
                <Button onClick={() => removeParticipant(index)} className="text-red-500">Ta bort</Button>
              )}
            </div>
          ))}

          <Button onClick={addParticipant} className="mb-4">Lägg till ännu en deltagare</Button>

          <Button onClick={handleBooking} className="bg-blue-600 text-white">Boka nu</Button>
        </div>
      )}
    </div>
  );
}
