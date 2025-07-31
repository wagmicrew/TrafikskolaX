'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Users, MapPin } from 'lucide-react';

interface HandledarSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  pricePerParticipant: number;
  teacherName: string;
  spotsLeft: number;
  formattedDateTime: string;
}

interface HandledarSessionSelectionProps {
  onComplete: (data: { selectedDate: Date; selectedTime: string }) => void;
  onBack: () => void;
  sessionType: any;
}

export function HandledarSessionSelection({ onComplete, onBack, sessionType }: HandledarSessionSelectionProps) {
  const [sessions, setSessions] = useState<HandledarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<HandledarSession | null>(null);

  useEffect(() => {
    fetchAvailableSessions();
  }, []);

  const fetchAvailableSessions = async () => {
    try {
      const response = await fetch('/api/handledar-sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.sessions.filter((session: HandledarSession) => session.spotsLeft > 0));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session: HandledarSession) => {
    setSelectedSession(session);
    // Convert session date and time to the expected format
    const sessionDate = new Date(session.date);
    const selectedTime = session.startTime.slice(0, 5); // HH:MM format
    
    onComplete({
      selectedDate: sessionDate,
      selectedTime: selectedTime
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar tillgängliga handledarkurser...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj Handledarkurs</h2>
        <p className="text-gray-600">Välj en tillgänglig handledarkurs med lediga platser</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Inga handledarkurser tillgängliga för tillfället.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                selectedSession?.id === session.id 
                  ? "ring-2 ring-orange-600 border-orange-600 bg-orange-50" 
                  : "hover:border-orange-300"
              }`}
              onClick={() => handleSessionSelect(session)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{session.title}</span>
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    Handledarkurs
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-600">{session.formattedDateTime}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {session.description && (
                    <p className="text-sm text-gray-600">{session.description}</p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>2 timmar</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{session.spotsLeft} av {session.maxParticipants} platser kvar</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{session.teacherName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-2xl font-bold text-orange-600">
                      {session.pricePerParticipant} kr
                    </span>
                    <span className="text-xs text-orange-600">per deltagare</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
      </div>
    </div>
  );
}
