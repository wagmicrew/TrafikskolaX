"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Bell } from "lucide-react"
import { OrbSpinner } from "@/components/ui/orb-loader"
import { toast } from "sonner"

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
  allowsSupervisors?: boolean
  pricePerSupervisor?: number
  maxParticipants?: number
  availableSessions?: number
  hasAvailableSessions?: boolean
}

interface LessonSelectionProps {
  onComplete: (data: { sessionType: SessionType }) => void
}

export function LessonSelection({ onComplete }: LessonSelectionProps) {
  const [sessionTypesList, setSessionTypesList] = useState<SessionType[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestingNotification, setRequestingNotification] = useState<string | null>(null)

  useEffect(() => {
    fetchSessionTypes()
  }, [])

  const fetchSessionTypes = async () => {
    try {
      const allSessions = [];

      /**
       * TABLE SEPARATION - CRITICAL
       * Each lesson type uses a specific table to avoid duplication
       *
       * 1. Regular driving lessons → lesson_types table
       * 2. Teori sessions → teori_lesson_types table (EXCLUSIVE)
       * 3. Handledar/supervisor training → session_types table
       */

      // 1. Regular driving lessons from lesson_types table
      // API: /api/lesson-types → lesson_types table
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
        console.error("Error fetching driving lessons from lesson_types:", lessonError)
      }

      // 2. ALL Theoretical lessons from teori_lesson_types table (UNIFIED)
      // API: /api/teori-sessions → teori_lesson_types table
      // This now includes both regular Teori and migrated Handledar sessions
      try {
        const teoriResponse = await fetch('/api/teori-sessions?scope=future')
        if (teoriResponse.ok) {
          const teoriData = await teoriResponse.json()

          // Group ALL theoretical sessions by lesson type
          if (teoriData.sessionsByType && teoriData.sessionsByType.length > 0) {
            const theoreticalSessions = teoriData.sessionsByType.map((group: any) => ({
              ...group.lessonType,
              type: group.lessonType.allowsSupervisors ? 'handledar' : 'teori',
              name: group.lessonType.name,
              description: group.lessonType.description,
              price: group.lessonType.price,
              durationMinutes: group.lessonType.durationMinutes || 60,
              availableSessions: group.sessions.length,
              sessions: group.sessions,
              hasAvailableSessions: group.hasAvailableSessions,
              allowsSupervisors: group.lessonType.allowsSupervisors,
              pricePerSupervisor: group.lessonType.pricePerSupervisor,
              requiresPersonalId: group.lessonType.allowsSupervisors // Handledar sessions require personal ID
            }))
            allSessions.push(...theoreticalSessions);
          }
        }
      } catch (teoriError) {
        console.error("Error fetching theoretical sessions from teori_lesson_types:", teoriError)
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

  const handleNotificationRequest = async (session: SessionType) => {
    setRequestingNotification(session.id)
    try {
      const response = await fetch('/api/teori/request-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonTypeId: session.id,
          lessonTypeName: session.name,
        }),
      })

      if (response.ok) {
        toast.success('Din förfrågan har skickats till skolan. Du kommer att meddelas när nya sessioner blir tillgängliga.')
      } else {
        toast.error('Kunde inte skicka förfrågan. Försök igen senare.')
      }
    } catch (error) {
      console.error('Error requesting notification:', error)
      toast.error('Ett fel uppstod. Försök igen senare.')
    } finally {
      setRequestingNotification(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <OrbSpinner size="md" />
        </div>
        <p className="text-gray-600">Laddar lektioner...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Välj typ av lektion</h2>
        <p className="text-gray-700">Välj mellan körlektioner, teoripass och handledarutbildning</p>
      </div>

            {/* Group by lesson type */}
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Regular Driving Lessons Group */}
        {sessionTypesList.filter(s => s.type === 'lesson').length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Körlektioner</h3>
              <p className="text-gray-600">Välj en körlektion och sedan tid</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionTypesList.filter(s => s.type === 'lesson').map((session) => (
                <Card
                  key={`${session.type}-${session.id}`}
                  className={`transition-all hover:shadow-lg relative border-2 ${
                    selectedSession?.id === session.id
                      ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50 cursor-pointer hover:scale-105"
                      : "hover:border-blue-300 border-gray-200 cursor-pointer hover:scale-105"
                  }`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900">{session.name}</h3>
                      <div className="flex items-center justify-center text-sm text-gray-700">
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
                          <div className="text-xs text-green-700 font-medium">Studentpris: {formatPrice(session.priceStudent)} kr</div>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-xs text-gray-600 mt-2">{session.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-blue-600 font-medium">Välj tid efter bokning</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Theory Lessons Group */}
        {sessionTypesList.filter(s => s.type === 'teori').length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Teorilektioner</h3>
              <p className="text-gray-600">Välj en teorisession direkt</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionTypesList.filter(s => s.type === 'teori').map((session) => (
                <Card
                  key={`${session.type}-${session.id}`}
                  className={`transition-all hover:shadow-lg relative border-2 ${
                    session.hasAvailableSessions
                      ? selectedSession?.id === session.id
                        ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50 cursor-pointer hover:scale-105"
                        : "border-blue-200 bg-blue-50 cursor-pointer hover:scale-105"
                      : "border-gray-300 bg-gray-50 cursor-default"
                  }`}
                  onClick={() => {
                    if (session.hasAvailableSessions) {
                      handleSessionSelect(session);
                    }
                  }}
                >
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Teori
                  </div>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900">{session.name}</h3>
                      <div className="flex items-center justify-center text-sm text-gray-700">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatDuration(session.durationMinutes)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-red-600">{formatPrice(session.price)} kr</div>
                        {session.maxParticipants && (
                          <div className="text-xs text-blue-700 font-medium">Max {session.maxParticipants} deltagare</div>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-xs text-gray-600 mt-2">{session.description}</p>
                      )}

                      {/* Available sessions info */}
                      {session.hasAvailableSessions && session.availableSessions && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm text-green-600 font-medium mb-2">
                            ✅ {session.availableSessions} sessioner tillgängliga
                          </div>
                          <p className="text-xs text-gray-600">Klicka för att välja session</p>
                        </div>
                      )}

                      {/* Notification button for unavailable sessions */}
                      {!session.hasAvailableSessions && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationRequest(session);
                            }}
                            disabled={requestingNotification === session.id}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
                          >
                            {requestingNotification === session.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                Skickar förfrågan...
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4 mr-2" />
                                Meddela mig när ledigt
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Få meddelande när nya sessioner blir tillgängliga
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Supervisor Training Group */}
        {sessionTypesList.filter(s => s.type === 'handledar').length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Handledarutbildning</h3>
              <p className="text-gray-600">För handledare och supervisorer</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionTypesList.filter(s => s.type === 'handledar').map((session) => (
                <Card
                  key={`${session.type}-${session.id}`}
                  className={`transition-all hover:shadow-lg relative border-2 ${
                    selectedSession?.id === session.id
                      ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50 cursor-pointer hover:scale-105"
                      : "border-orange-200 bg-orange-50 cursor-pointer hover:scale-105"
                  }`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Handledar
                  </div>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900">{session.name}</h3>
                      <div className="flex items-center justify-center text-sm text-gray-700">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatDuration(session.durationMinutes)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-red-600">{formatPrice(session.price)} kr</div>
                        <div className="text-xs text-orange-700 font-medium">Per deltagare</div>
                        {session.pricePerSupervisor && (
                          <div className="text-xs text-orange-600">+{formatPrice(session.pricePerSupervisor)} kr per extra handledare</div>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-xs text-gray-600 mt-2">{session.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-orange-600 font-medium">Välj tid efter bokning</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {sessionTypesList.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Inga sessioner tillgängliga för tillfället.</p>
        </div>
      )}
    </div>
  )
}
