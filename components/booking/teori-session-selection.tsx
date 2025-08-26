"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, Users, Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { OrbSpinner } from "@/components/ui/orb-loader"

interface TeoriSession {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  currentParticipants: number
  lessonType: {
    id: string
    name: string
    price: string
    durationMinutes: number
    allowsSupervisors?: boolean
    pricePerSupervisor?: string
  }
}

interface TeoriSelectionSessionType {
  id: string
  type: 'teori' | 'lesson' | 'handledar'
  name: string
  description: string | null
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  isActive: boolean
  allowsSupervisors?: boolean
  pricePerSupervisor?: number
  maxParticipants?: number
}

interface TeoriSessionSelectionProps {
  sessionType: TeoriSelectionSessionType
  onComplete: (data: { selectedDate: Date; selectedTime: string; sessionId: string; totalPrice: number }) => void
  onBack: () => void
}

export function TeoriSessionSelection({ sessionType, onComplete, onBack }: TeoriSessionSelectionProps) {
  const [sessions, setSessions] = useState<TeoriSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<TeoriSession | null>(null)
  const [requestingNotification, setRequestingNotification] = useState(false)

  useEffect(() => {
    fetchTeoriSessions()
  }, [sessionType.id])

  const fetchTeoriSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teori/sessions?lessonTypeId=${sessionType.id}&available=true`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        console.error('Failed to fetch teori sessions')
        setSessions([])
      }
    } catch (error) {
      console.error('Error fetching teori sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove seconds
  }

  const formatPrice = (amount: string | number) => {
    const price = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('sv-SE').format(price)
  }

  const handleSessionSelect = (session: TeoriSession) => {
    setSelectedSession(session)
    const selectedDate = new Date(session.date)
    const totalPrice = parseFloat(session.lessonType.price)
    
    onComplete({
      selectedDate,
      selectedTime: session.startTime,
      sessionId: session.id,
      totalPrice
    })
  }

  const handleRequestNotification = async () => {
    setRequestingNotification(true)
    try {
      const response = await fetch('/api/teori/request-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonTypeId: sessionType.id,
          lessonTypeName: sessionType.name,
        }),
      })

      if (response.ok) {
        toast.success('Din förfrågan har skickats till skolan. Du kommer att kontaktas när nya sessioner är tillgängliga.')
      } else {
        toast.error('Kunde inte skicka förfrågan. Försök igen senare.')
      }
    } catch (error) {
      console.error('Error requesting notification:', error)
      toast.error('Ett fel uppstod. Försök igen senare.')
    } finally {
      setRequestingNotification(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <OrbSpinner size="md" />
        </div>
        <p className="text-gray-600 font-medium">Laddar tillgängliga teorisessioner...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </Button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Välj teorisession</h2>
          <p className="text-gray-800 font-medium leading-relaxed">
            Välj en tillgänglig session för {sessionType.name}
          </p>
        </div>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="max-w-md mx-auto">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Inga sessioner tillgängliga</h3>
            <p className="text-gray-800 mb-6 font-medium leading-relaxed">
              Det finns för närvarande inga tillgängliga sessioner för {sessionType.name}.
              Vi kan meddela dig när nya sessioner blir tillgängliga.
            </p>
            <Button
              onClick={handleRequestNotification}
              disabled={requestingNotification}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              {requestingNotification ? (
                <span className="inline-flex items-center gap-2">
                  <OrbSpinner size="sm" className="border-white/40" />
                  Skickar förfrågan...
                </span>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Meddela mig när sessioner finns
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {sessions.map((session) => {
            const isAvailable = session.currentParticipants < session.maxParticipants
            
            return (
              <Card
                key={session.id}
                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 relative ${
                  selectedSession?.id === session.id 
                    ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50" 
                    : isAvailable 
                      ? "hover:border-blue-300 border-gray-200" 
                      : "opacity-60 cursor-not-allowed border-gray-200"
                }`}
                onClick={() => isAvailable && handleSessionSelect(session)}
              >
                {!isAvailable && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    Fullbokad
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900 tracking-tight">{session.title}</h3>
                    
                    {session.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{session.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium">{formatDate(session.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium">
                          {session.currentParticipants}/{session.maxParticipants} deltagare
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(session.lessonType.price)} kr
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex justify-center pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="font-semibold px-6 py-3 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          Tillbaka
        </Button>
      </div>
    </div>
  )
}
