"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Bell, ArrowLeft } from "lucide-react"
import { OrbSpinner } from "@/components/ui/orb-loader"
import { toast } from "sonner"
import { Banner } from "flowbite-react"

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
  const [impersonating, setImpersonating] = useState(false)
  const [restoringAdmin, setRestoringAdmin] = useState(false)

  useEffect(() => {
    fetchSessionTypes()
  }, [])
  
  useEffect(() => {
    // Check if user is being impersonated
    fetch('/api/auth/impersonation-status')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setImpersonating(Boolean(data?.impersonating)))
      .catch(() => setImpersonating(false))
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

      // 2. Public Teori sessions grouped by lesson type (UNIFIED)
      // API: /api/teori/sessions?available=true → flat sessions with embedded lessonType
      try {
        const teoriResponse = await fetch('/api/teori/sessions?available=true')
        if (teoriResponse.ok) {
          const teoriData = await teoriResponse.json()

          if (teoriData?.sessions && Array.isArray(teoriData.sessions)) {
            const groups = new Map<string, { lessonType: any; sessions: any[] }>()

            for (const s of teoriData.sessions) {
              const lt = s.lessonType || {}
              const key = lt.id || 'unknown'
              if (!groups.has(key)) {
                groups.set(key, { lessonType: lt, sessions: [] })
              }
              groups.get(key)!.sessions.push(s)
            }

            const theoreticalSessions = Array.from(groups.values()).map(({ lessonType: lt, sessions }) => ({
              ...lt,
              type: lt.allowsSupervisors ? 'handledar' as const : 'teori' as const,
              name: lt.name,
              description: lt.description,
              price: typeof lt.price === 'string' ? parseFloat(lt.price) : lt.price,
              durationMinutes: lt.durationMinutes || 60,
              availableSessions: sessions.length,
              sessions,
              hasAvailableSessions: sessions.length > 0,
              allowsSupervisors: lt.allowsSupervisors,
              pricePerSupervisor: typeof lt.pricePerSupervisor === 'string' ? parseFloat(lt.pricePerSupervisor) : lt.pricePerSupervisor,
              requiresPersonalId: lt.allowsSupervisors
            }))

            allSessions.push(...theoreticalSessions)
          }
        }
      } catch (teoriError) {
        console.error("Error fetching public theoretical sessions:", teoriError)
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

  const handleReturnToAdmin = async () => {
    setRestoringAdmin(true);
    try {
      const res = await fetch('/api/auth/impersonate', { method: 'DELETE' });
      const data = await res.json();
      
      if (data?.token) {
        try { localStorage.setItem('auth-token', data.token); } catch {}
        document.cookie = `auth-token=${data.token}; path=/; max-age=604800`;
      } else {
        // Fallback: if we saved admin backup in localStorage at impersonation time
        const backup = localStorage.getItem('admin-session-token');
        if (backup) {
          try { localStorage.setItem('auth-token', backup); } catch {}
          document.cookie = `auth-token=${backup}; path=/; max-age=604800`;
        }
      }
      
      // Redirect to admin dashboard
      window.location.href = '/dashboard/admin';
    } catch (error) {
      console.error('Error returning to admin:', error);
      toast.error('Det gick inte att återgå till admin. Försök igen.');
      setRestoringAdmin(false);
    }
  };

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
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="text-center px-2">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Välj Lektionstyp</h2>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Välj den typ av lektion du vill boka
        </p>
      </div>

            {/* Group by lesson type */}
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Regular Driving Lessons Group */}
        {sessionTypesList.filter(s => s.type === 'lesson').length > 0 && (
          <div className="space-y-4">
            <div className="text-center px-2">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Körlektioner</h3>
              <p className="text-gray-600 text-sm sm:text-base">Praktiska körlektioner med instruktör</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                      {session.description && (
                        <p className="text-sm text-gray-600 mt-2">{session.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-blue-600 font-medium">
                          {session.type === 'lesson'
                            ? 'Välj tid efter bokning'
                            : (session.availableSessions ?? 0) > 0
                              ? `${session.availableSessions ?? 0} tillgängliga sessioner`
                              : 'Inga tillgängliga sessioner'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

                 {/* Theory Lessons Group - Unified (includes both teori and handledar sessions) */}
        {sessionTypesList.filter(s => s.type === 'teori' || s.type === 'handledar').length > 0 && (
          <div className="space-y-4">
            <div className="text-center px-2">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Teorilektioner</h3>
              <p className="text-gray-600 text-sm sm:text-base">Teoretiska lektioner och handledarutbildning</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sessionTypesList.filter(s => s.type === 'teori' || s.type === 'handledar').map((session) => (
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
                    if (session.hasAvailableSessions || session.type === 'handledar') {
                      handleSessionSelect(session);
                    }
                  }}
                >
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {session.type === 'handledar' ? 'Handledar' : 'Teori'}
                  </div>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900">{session.name}</h3>

                      {session.description && (
                        <p className="text-xs text-gray-600 mt-2">{session.description}</p>
                      )}

                      {/* Available sessions info */}
                      {session.hasAvailableSessions && (session.availableSessions ?? 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm text-green-600 font-medium mb-2">
                            ✅ {session.availableSessions ?? 0} sessioner tillgängliga
                          </div>
                          <p className="text-xs text-gray-600">Klicka för att välja session</p>
                        </div>
                      )}

                      {/* Handledar sessions are always available */}
                      {session.type === 'handledar' && !session.hasAvailableSessions && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm text-green-600 font-medium mb-2">
                            ✅ Tillgänglig för bokning
                          </div>
                          <p className="text-xs text-gray-600">Klicka för att fortsätta</p>
                        </div>
                      )}

                      {/* Notification button for unavailable sessions */}
                      {!session.hasAvailableSessions && session.type === 'teori' && (
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
      </div>

      {sessionTypesList.filter(s => s.type === 'teori' || s.type === 'handledar').length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Inga teorisessioner tillgängliga för tillfället.</p>
        </div>
      )}
    </div>
  )
}
