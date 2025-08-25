"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, Users, ArrowLeft } from "lucide-react"

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

interface Session {
  id: string
  sessionTypeId: string
  title: string
  description: string | null
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  currentParticipants: number
  isActive: boolean
  sessionType: {
    id: string
    name: string
    type: string
    basePrice: number
    pricePerSupervisor: number
    allowsSupervisors: boolean
    requiresPersonalId: boolean
    durationMinutes: number
  }
}

interface SessionSelectionProps {
  sessionType: SessionType
  onComplete: (data: { selectedSession: Session; sessionType: SessionType }) => void
  onBack: () => void
}

export function SessionSelection({ sessionType, onComplete, onBack }: SessionSelectionProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [sessionType.id])

  const fetchSessions = async () => {
    try {
      let apiUrl = '';

      // Determine which API to use based on session type
      if (sessionType.type === 'teori') {
        apiUrl = `/api/teori-sessions?scope=future&typeId=${sessionType.id}`;
      } else {
        apiUrl = `/api/sessions?scope=future&typeId=${sessionType.id}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();

        // Check if Teori system needs setup
        if (data.needsSetup) {
          console.log('Teori system needs setup:', data.error);
          setSessions([]);
          return;
        }

        if (sessionType.type === 'teori') {
          // For Teori sessions, extract sessions from the specific lesson type group
          console.log('Teori session data:', data);
          const lessonTypeGroup = data.sessionsByType?.find((group: any) => group.lessonType.id === sessionType.id);
          console.log('Lesson type group:', lessonTypeGroup);
          const sessionsData = lessonTypeGroup?.sessions || [];
          console.log('Setting Teori sessions:', sessionsData);
          setSessions(sessionsData);
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

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr)
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return 'TBD';
    return timeStr.substring(0, 5) // Remove seconds
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('sv-SE').format(amount)
  }

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session)
    setTimeout(() => {
      onComplete({ selectedSession: session, sessionType })
    }, 300)
  }

  const getAvailableSpots = (session: Session) => {
    return session.maxParticipants - session.currentParticipants
  }

  const getAvailabilityColor = (session: Session) => {
    const remaining = getAvailableSpots(session)
    if (remaining <= 0) return 'red'
    if (remaining <= Math.max(1, Math.floor(session.maxParticipants * 0.2))) return 'yellow'
    return 'green'
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
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
                  ? "ring-2 ring-red-600 border-red-600 bg-red-50" 
                  : isFull 
                    ? "opacity-60 cursor-not-allowed border-gray-300" 
                    : "hover:border-red-300"
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
                    <span>{formatDate(session.date)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {availableSpots} av {session.maxParticipants} platser kvar
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pris:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(sessionType.basePrice || sessionType.price)} kr
                    </span>
                  </div>
                  {sessionType.allowsSupervisors && sessionType.pricePerSupervisor && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Extra handledare:</span>
                      <span className="text-sm text-gray-600">
                        +{formatPrice(sessionType.pricePerSupervisor)} kr/st
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
