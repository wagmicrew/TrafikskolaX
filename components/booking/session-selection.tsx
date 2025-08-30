"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, ArrowLeft } from "lucide-react"
import { OrbSpinner } from "@/components/ui/orb-loader"
import { toast } from "sonner"

interface SessionType {
  id: string
  type: string
  name: string
  description: string | null
  durationMinutes: number
  basePrice: number
  price: number
  pricePerSupervisor?: number
  allowsSupervisors?: boolean
  requiresPersonalId?: boolean
  isActive: boolean
}

interface TeoriSession {
  id: string
  lesson_type_id: string
  title: string
  description: string | null
  date: string
  start_time: string
  end_time: string
  max_participants: number
  current_participants: number
  teacher_id: string | null
  is_active: boolean
  lesson_type_name: string
  lesson_type_description: string | null
  allows_supervisors: boolean
  price: number
  price_per_supervisor: number | null
  duration_minutes: number
  booked_count: number
  available_spots?: number
  formatted_date_time?: string
}

interface SessionSelectionProps {
  sessionType: SessionType
  onComplete: (data: { session: TeoriSession }) => void
  onBack: () => void
}

export function SessionSelection({ sessionType, onComplete, onBack }: SessionSelectionProps) {
  const [sessions, setSessions] = useState<TeoriSession[]>([])
  const [selectedSession, setSelectedSession] = useState<TeoriSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [sessionType.id])

  const fetchSessions = async () => {
    try {
      let apiUrl = '';

      // Determine which API to use based on session type
      if (sessionType.type === 'teori' || sessionType.type === 'handledar') {
        apiUrl = `/api/teori/sessions?available=true&lessonTypeId=${sessionType.id}`;
      } else {
        apiUrl = `/api/sessions?scope=future&typeId=${sessionType.id}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();

        if (sessionType.type === 'teori' || sessionType.type === 'handledar') {
          // Public teori API returns flat sessions with embedded lessonType
          const sessionsData = Array.isArray(data.sessions) ? data.sessions : []

          const enhancedSessions = sessionsData.map((session: any) => ({
            id: session.id,
            lesson_type_id: session.lessonType?.id,
            title: session.title,
            description: session.description ?? null,
            date: session.date,
            start_time: session.startTime,
            end_time: session.endTime,
            max_participants: session.maxParticipants,
            current_participants: session.currentParticipants,
            teacher_id: null,
            is_active: session.isActive,
            lesson_type_name: session.lessonType?.name,
            lesson_type_description: session.lessonType?.description ?? null,
            allows_supervisors: !!session.lessonType?.allowsSupervisors,
            price: (() => {
              const v = session.lessonType?.price ?? 0
              return typeof v === 'string' ? parseFloat(v) : Number(v)
            })(),
            price_per_supervisor: (() => {
              const v = session.lessonType?.pricePerSupervisor ?? null
              return v == null ? null : (typeof v === 'string' ? parseFloat(v) : Number(v))
            })(),
            duration_minutes: session.lessonType?.durationMinutes ?? 60,
            booked_count: session.bookedCount ?? 0,
            available_spots: (session.maxParticipants || 0) - (session.currentParticipants || 0) - (session.bookedCount || 0),
            formatted_date_time: formatDateTime(session.date, session.startTime, session.endTime),
          }))

          setSessions(enhancedSessions)
        } else {
          console.log('Setting unified sessions:', data.sessions || []);
          setSessions(data.sessions || []);
        }
      } else {
        console.error("Error fetching sessions:", await response.text())
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateStr: string | Date, startTime: string, endTime: string) => {
    try {
      let date: Date;
      if (dateStr instanceof Date) {
        date = dateStr;
      } else if (typeof dateStr === 'string') {
        // Ensure proper date parsing by adding time component if missing
        const dateWithTime = dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00';
        date = new Date(dateWithTime);
      } else {
        date = new Date(String(dateStr));
      }

      if (isNaN(date.getTime())) {
        console.error('Invalid date in formatDateTime:', dateStr);
        return `Ogiltigt datum ${startTime || ''} - ${endTime || ''}`.trim();
      }

      const formattedDate = date.toLocaleDateString('sv-SE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const start = startTime ? startTime.substring(0, 5) : 'TBD';
      const end = endTime ? endTime.substring(0, 5) : 'TBD';
      return `${formattedDate} ${start} - ${end}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return `Felaktigt datum ${startTime || ''} - ${endTime || ''}`.trim();
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sv-SE').format(amount)
  }

  const handleSessionSelect = (session: TeoriSession) => {
    setSelectedSession(session)
    setTimeout(() => {
      onComplete({ session })
    }, 300)
  }

  const getAvailableSpots = (session: TeoriSession) => {
    return session.available_spots || (session.max_participants - (session.booked_count || 0) - (session.current_participants || 0))
  }

  const getAvailabilityColor = (session: TeoriSession) => {
    const remaining = getAvailableSpots(session)
    if (remaining <= 0) return 'red'
    if (remaining <= Math.max(1, Math.floor(session.max_participants * 0.2))) return 'yellow'
    return 'green'
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <OrbSpinner size="md" />
        </div>
        <p className="text-gray-600">Laddar tillgängliga sessioner...</p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga tillgängliga sessioner</h3>
          {sessionType.type === 'teori' ? (
            <div className="text-gray-600 mb-6">
              <p className="mb-2">
                Det finns inga schemalagda sessioner för <strong>{sessionType.name}</strong> just nu.
              </p>
              <p className="text-sm text-orange-600">
                Teori-systemet kan behöva konfigureras. Kontakta administratören.
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mb-6">
              Det finns inga schemalagda sessioner för <strong>{sessionType.name}</strong> just nu.
            </p>
          )}
          <Button variant="outline" onClick={onBack} className="inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Välj annan session
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till sessiontyper
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Välj {sessionType.name}
        </h2>
        <p className="text-gray-600">Välj en av de tillgängliga sessionerna nedan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {sessions.map((session) => {
          const availableSpots = getAvailableSpots(session)
          const isFull = availableSpots <= 0
          const availability = getAvailabilityColor(session)
          
          return (
            <Card
              key={session.id}
              className={`cursor-pointer transition-all hover:shadow-lg relative ${
                selectedSession?.id === session.id 
                  ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50" 
                  : isFull 
                    ? "opacity-60 cursor-not-allowed border-gray-300" 
                    : "hover:border-blue-300"
              }`}
              onClick={() => !isFull && handleSessionSelect(session)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {session.title}
                    </h3>
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {session.description}
                      </p>
                    )}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full text-white"
                    style={{
                      backgroundColor: availability === 'green' ? '#16a34a' : availability === 'yellow' ? '#ca8a04' : '#dc2626'
                    }}
                  >
                    {availability === 'green' && 'Lediga platser'}
                    {availability === 'yellow' && 'Begränsat antal'}
                    {availability === 'red' && 'Fullbokad'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{session.formatted_date_time || formatDateTime(session.date, session.start_time, session.end_time)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{session.duration_minutes} minuter</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {availableSpots} av {session.max_participants} platser kvar
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pris:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(session.price)} kr
                    </span>
                  </div>
                  {session.allows_supervisors && session.price_per_supervisor && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Extra handledare:</span>
                      <span className="text-sm text-gray-600">
                        +{formatPrice(session.price_per_supervisor)} kr/st
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
