'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface TeoriLessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  price: number;
  pricePerSupervisor?: number;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
  sessions?: TeoriSession[];
}

interface TeoriSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  pricePerSupervisor?: number;
  availableSpots: number;
  formattedDateTime: string;
  allowsSupervisors: boolean;
}

interface TeoriSessionCardsProps {
  lessonType: TeoriLessonType;
  onSessionSelect: (session: TeoriSession) => void;
}

export function TeoriSessionCards({ lessonType, onSessionSelect }: TeoriSessionCardsProps) {
  const [sessions, setSessions] = useState<TeoriSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'spots'>('date');

  useEffect(() => {
    loadSessions();
  }, [lessonType.id]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teori/sessions?lessonTypeId=${lessonType.id}&available=true`);
      if (response.ok) {
        const data = await response.json();
        const processedSessions = (data.sessions || []).map((session: any) => ({
          ...session,
          availableSpots: session.maxParticipants - session.currentParticipants,
          allowsSupervisors: lessonType.allowsSupervisors
        }));
        setSessions(processedSessions);
      } else {
        console.error('Failed to load sessions');
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityColor = (availableSpots: number, maxParticipants: number) => {
    const ratio = availableSpots / maxParticipants;
    if (ratio >= 0.5) return 'green';
    if (ratio >= 0.2) return 'orange';
    return 'red';
  };

  const getAvailabilityBadge = (availableSpots: number, maxParticipants: number) => {
    const color = getAvailabilityColor(availableSpots, maxParticipants);

    if (availableSpots === 0) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Fullbokad
        </Badge>
      );
    }

    return (
      <Badge
        variant="secondary"
        className={`${
          color === 'green'
            ? 'bg-green-100 text-green-800'
            : color === 'orange'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-red-100 text-red-800'
        }`}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        {availableSpots} platser kvar
      </Badge>
    );
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime();
    } else {
      return b.availableSpots - a.availableSpots;
    }
  });

  const availableSessions = sortedSessions.filter(session => session.availableSpots > 0);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar tillgängliga utbildningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tillgängliga {lessonType.name}
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Välj en utbildningstillfälle från de tillgängliga alternativen
        </p>

        {/* Sort Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            onClick={() => setSortBy('date')}
            className="bg-red-600 hover:bg-red-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Sortera efter datum
          </Button>
          <Button
            variant={sortBy === 'spots' ? 'default' : 'outline'}
            onClick={() => setSortBy('spots')}
            className="bg-red-600 hover:bg-red-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Sortera efter platser
          </Button>
        </div>
      </div>

      {/* No Sessions Available */}
      {availableSessions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Inga tillgängliga utbildningar
            </h3>
            <p className="text-gray-600 mb-4">
              Det finns för närvarande inga lediga platser för denna utbildning.
            </p>
            <p className="text-sm text-gray-500">
              Kontrollera senare eller välj en annan utbildningstyp.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableSessions.map((session) => (
          <Card
            key={session.id}
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-red-600"
            onClick={() => onSessionSelect(session)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{session.title}</CardTitle>
                  {getAvailabilityBadge(session.availableSpots, session.maxParticipants)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {session.description && (
                <p className="text-gray-600 text-sm line-clamp-2">
                  {session.description}
                </p>
              )}

              {/* Date and Time */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: sv })}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    {session.startTime} - {session.endTime}
                    ({lessonType.durationMinutes} min)
                  </span>
                </div>
              </div>

              {/* Capacity Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>
                    {session.currentParticipants}/{session.maxParticipants} deltagare
                  </span>
                </div>
              </div>

              {/* Price Info */}
              <div className="space-y-1 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pris:</span>
                  <span className="font-semibold text-lg">{session.price}€</span>
                </div>

                {lessonType.allowsSupervisors && lessonType.pricePerSupervisor && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Handledare:</span>
                    <span className="text-sm text-gray-500">
                      +{lessonType.pricePerSupervisor}€ per person
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                className="w-full bg-red-600 hover:bg-red-700 mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onSessionSelect(session);
                }}
              >
                Välj denna utbildning
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 mb-1">Garanti</h4>
            <p className="text-sm text-blue-700">
              Alla utbildningar genomförs enligt plan
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 mb-1">Flexibelt</h4>
            <p className="text-sm text-blue-700">
              Boka om kostnadsfritt upp till 24h innan
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-blue-900 mb-1">Handledare</h4>
            <p className="text-sm text-blue-700">
              Möjlighet att ta med handledare om tillåtet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
