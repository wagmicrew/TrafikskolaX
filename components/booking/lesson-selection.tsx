"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface SessionType {
  id: string
  type: 'lesson' | 'handledar' | 'teori';
  name: string
  description: string | null
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  isActive: boolean
}

interface LessonSelectionProps {
  onComplete: (data: { sessionType: SessionType }) => void
}

export function LessonSelection({ onComplete }: LessonSelectionProps) {
  const [sessionTypesList, setSessionTypesList] = useState<SessionType[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessionTypes()
  }, [])

  const fetchSessionTypes = async () => {
    try {
      const allSessions = [];
      
      // Fetch regular lessons (legacy lesson types)
      try {
        const lessonResponse = await fetch('/api/lesson-types')
        if (lessonResponse.ok) {
          const lessonData = await lessonResponse.json()
          const lessons = (lessonData.lessonTypes || []).map((lesson: any) => ({
            ...lesson,
            type: 'lesson' as const,
            basePrice: lesson.price, // Map to basePrice for consistency
          }))
          allSessions.push(...lessons);
        }
      } catch (lessonError) {
        console.error("Error fetching legacy lessons:", lessonError)
      }

      // Fetch new session types (including handledar sessions)
      try {
        const sessionTypesResponse = await fetch('/api/session-types')
        if (sessionTypesResponse.ok) {
          const sessionTypesData = await sessionTypesResponse.json()
          const newSessions = (sessionTypesData.sessionTypes || []).map((sessionType: any) => ({
            ...sessionType,
            type: sessionType.type === 'handledarutbildning' ? 'handledar' : sessionType.type,
            price: sessionType.basePrice,
            basePrice: sessionType.basePrice,
            allowsSupervisors: sessionType.allowsSupervisors,
            pricePerSupervisor: sessionType.pricePerSupervisor,
            requiresPersonalId: sessionType.requiresPersonalId
          }))
          allSessions.push(...newSessions);
        }
      } catch (sessionTypesError) {
        console.error("Error fetching new session types:", sessionTypesError)
      }

      // Fetch Teori sessions
      try {
        console.log("[LESSON SELECTION DEBUG] Fetching Teori sessions...")
        const teoriResponse = await fetch('/api/teori-sessions?scope=future')
        console.log("[LESSON SELECTION DEBUG] Teori response status:", teoriResponse.status)
        console.log("[LESSON SELECTION DEBUG] Teori response ok:", teoriResponse.ok)

        if (teoriResponse.ok) {
          const teoriData = await teoriResponse.json()
          console.log("[LESSON SELECTION DEBUG] Teori data:", teoriData)
          console.log("[LESSON SELECTION DEBUG] Total available sessions:", teoriData.totalAvailable)

          // Group Teori sessions by lesson type
          if (teoriData.sessionsByType && teoriData.sessionsByType.length > 0) {
            const teoriSessions = teoriData.sessionsByType.map((group: any) => ({
              ...group.lessonType,
              type: 'teori' as const,
              name: group.lessonType.name,
              description: group.lessonType.description,
              price: group.lessonType.price,
              durationMinutes: group.lessonType.duration_minutes || 60,
              availableSessions: group.sessions.length,
              sessions: group.sessions
            }))
            console.log("[LESSON SELECTION DEBUG] Processed Teori sessions:", teoriSessions)
            allSessions.push(...teoriSessions);
          } else {
            console.log("[LESSON SELECTION DEBUG] No available Teori sessions found")
          }
        } else {
          console.error("[LESSON SELECTION DEBUG] Teori API error:", await teoriResponse.text())
        }
      } catch (teoriError) {
        console.error("Error fetching Teori sessions:", teoriError)
      }

      setSessionTypesList(allSessions)
    } catch (error) {
      console.error("Error fetching session types:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${mins}min`
    }
  }

  const formatPrice = (amount?: number) => {
    if (amount == null) return ''
    try {
      return new Intl.NumberFormat('sv-SE').format(amount)
    } catch {
      return String(amount)
    }
  }

  const handleSessionSelect = (session: SessionType) => {
    setSelectedSession(session)
    // Auto-continue after selection
    setTimeout(() => {
      onComplete({ sessionType: session })
    }, 300)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar lektioner...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj session</h2>
        <p className="text-gray-600">Välj mellan körlektioner och teoripass</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {sessionTypesList.map((session) => (
          <Card
            key={`${session.type}-${session.id}`}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 relative ${
              selectedSession?.id === session.id ? "ring-2 ring-red-600 border-red-600 bg-red-50" : "hover:border-red-300"
            } ${session.type === 'handledar' ? 'border-orange-200 bg-orange-50' : ''}
            ${session.type === 'teori' ? 'border-blue-200 bg-blue-50' : ''}`}
            onClick={() => handleSessionSelect(session)}
          >
            {session.type === 'teori' && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Teori
              </div>
            )}
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg text-gray-800">{session.name}</h3>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatDuration(session.durationMinutes)}</span>
                </div>
                <div className="space-y-1">
              {session.salePrice ? (
                    <>
                      <div className="text-2xl font-bold text-red-600">{formatPrice(session.salePrice)} kr</div>
                      <div className="text-sm text-gray-500 line-through">{formatPrice(session.price)} kr</div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-red-600">{formatPrice(session.price)} kr</div>
                  )}
                  {session.priceStudent && (
                    <div className="text-xs text-green-600">Studentpris: {formatPrice(session.priceStudent)} kr</div>
                  )}
                  {session.type === 'handledar' && (
                    <div className="text-xs text-orange-600 font-medium">Per deltagare</div>
                  )}
                  {session.type === 'teori' && session.availableSessions && (
                    <div className="text-xs text-blue-600 font-medium">{session.availableSessions} sessioner tillgängliga</div>
                  )}
                </div>
                {session.description && (
                  <p className="text-xs text-gray-500 mt-2">{session.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessionTypesList.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Inga sessioner tillgängliga för tillfället.</p>
        </div>
      )}
    </div>
  )
}
