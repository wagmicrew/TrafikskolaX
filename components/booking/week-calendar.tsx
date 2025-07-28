"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, isSameDay } from "date-fns"
import { sv } from "date-fns/locale"

interface TimeSlot {
  time: string
  available: boolean
}

interface WeekCalendarProps {
  selectedDate: Date | null
  selectedTime: string | null
  onDateTimeSelect: (date: Date, time: string) => void
  onNext: () => void
  onBack: () => void
  lessonDuration: number
}

export function WeekCalendar({
  selectedDate,
  selectedTime,
  onDateTimeSelect,
  onNext,
  onBack,
  lessonDuration
}: WeekCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { locale: sv }))
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<Record<string, TimeSlot[]>>({})

  useEffect(() => {
    fetchAvailableSlots()
  }, [currentWeek, lessonDuration])

  const fetchAvailableSlots = async () => {
    setLoading(true)
    try {
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
      const startDate = format(weekDates[0], 'yyyy-MM-dd')
      const endDate = format(weekDates[6], 'yyyy-MM-dd')

      const response = await fetch(`/api/booking/slots?startDate=${startDate}&endDate=${endDate}&duration=${lessonDuration}`)
      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.slots)
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeek, i)
    return {
      date,
      dayName: format(date, 'EEEE', { locale: sv }),
      dayNumber: format(date, 'd'),
      month: format(date, 'MMM', { locale: sv }),
      dateKey: format(date, 'yyyy-MM-dd')
    }
  })

  const handleDateSelect = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date) && selectedTime) {
      // If clicking the same date, clear the time
      onDateTimeSelect(date, '')
    } else {
      onDateTimeSelect(date, '')
    }
  }

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onDateTimeSelect(selectedDate, time)
    }
  }

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  const handlePrevWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, -1))
  }

  const canProceed = selectedDate && selectedTime

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj datum och tid</h2>
            <p className="text-gray-600">Välj en ledig tid för din körlektion</p>
          </div>

          {/* Week navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Föregående vecka
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentWeek, 'MMMM yyyy', { locale: sv })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="flex items-center gap-2"
            >
              Nästa vecka
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {weekDays.map((day) => {
              const isSelected = selectedDate && isSameDay(selectedDate, day.date)
              const daySlots = availableSlots[day.dateKey] || []
              const hasAvailableSlots = daySlots.some(slot => slot.available)

              return (
                <div
                  key={day.dateKey}
                  className={`
                    p-3 rounded-lg text-center cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-red-600 text-white' 
                      : hasAvailableSlots
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'bg-gray-100 opacity-50 cursor-not-allowed'
                    }
                  `}
                  onClick={() => hasAvailableSlots && handleDateSelect(day.date)}
                >
                  <div className="text-xs font-medium mb-1">{day.dayName}</div>
                  <div className="text-lg font-bold">{day.dayNumber}</div>
                  <div className="text-xs">{day.month}</div>
                </div>
              )
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Tillgängliga tider för {format(selectedDate, 'EEEE d MMMM', { locale: sv })}
              </h4>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {(availableSlots[format(selectedDate, 'yyyy-MM-dd')] || []).map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => handleTimeSelect(slot.time)}
                      className={`
                        ${selectedTime === slot.time 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : ''
                        }
                        ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Tillbaka
            </Button>
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Nästa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
