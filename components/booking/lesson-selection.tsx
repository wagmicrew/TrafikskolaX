"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { db } from "@/lib/db"
import { lessonTypes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface LessonType {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  priceStudent?: number
  salePrice?: number
  isActive: boolean
}

interface LessonSelectionProps {
  onComplete: (data: { lessonType: LessonType }) => void
}

export function LessonSelection({ onComplete }: LessonSelectionProps) {
  const [lessonTypesList, setLessonTypesList] = useState<LessonType[]>([])
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLessonTypes()
  }, [])

  const fetchLessonTypes = async () => {
    try {
      const response = await fetch('/api/lesson-types')
      const data = await response.json()
      setLessonTypesList(data.lessonTypes || [])
    } catch (error) {
      console.error("Error fetching lesson types:", error)
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

  const handleLessonSelect = (lesson: LessonType) => {
    setSelectedLesson(lesson)
    // Auto-continue after selection
    setTimeout(() => {
      onComplete({ lessonType: lesson })
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj körlektion</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {lessonTypesList.map((lesson) => (
          <Card
            key={lesson.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              selectedLesson?.id === lesson.id ? "ring-2 ring-red-600 border-red-600 bg-red-50" : "hover:border-red-300"
            }`}
            onClick={() => handleLessonSelect(lesson)}
          >
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg text-gray-800">{lesson.name}</h3>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatDuration(lesson.durationMinutes)}</span>
                </div>
                <div className="space-y-1">
                  {lesson.salePrice ? (
                    <>
                      <div className="text-2xl font-bold text-red-600">{lesson.salePrice} kr</div>
                      <div className="text-sm text-gray-500 line-through">{lesson.price} kr</div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-red-600">{lesson.price} kr</div>
                  )}
                  {lesson.priceStudent && (
                    <div className="text-xs text-green-600">Studentpris: {lesson.priceStudent} kr</div>
                  )}
                </div>
                {lesson.description && (
                  <p className="text-xs text-gray-500 mt-2">{lesson.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lessonTypesList.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Inga lektioner tillgängliga för tillfället.</p>
        </div>
      )}
    </div>
  )
}
