"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, isSameDay } from "date-fns"
import { sv } from "date-fns/locale"
import { toast } from "react-hot-toast"

interface TimeSlot {
  time: string
  available: boolean
  unavailable: boolean
  hasBooking: boolean
  isWithinTwoHours?: boolean
  callForBooking?: boolean
  callPhone?: string
  gradient: 'green' | 'red' | 'orange'
  clickable: boolean
  hasStaleBooking?: boolean
  statusText?: string
}

interface LessonType {
  id: string
  name: string
  durationMinutes: number
}

interface WeekCalendarProps {
  lessonType: LessonType
  transmissionType: "manual" | "automatic" | null
  totalPrice?: number
  onComplete: (data: { selectedDate: Date; selectedTime: string; bookingId?: string }) => void
  onBack: () => void
}

export function WeekCalendar({
  lessonType,
  transmissionType,
  totalPrice = 0,
  onComplete,
  onBack
}: WeekCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Start of week in Sweden is Monday (weekStartsOn: 1)
    return startOfWeek(new Date(), { weekStartsOn: 1 })
  })
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<Record<string, TimeSlot[]>>({})
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [checkingSlots, setCheckingSlots] = useState(false)

  useEffect(() => {
    fetchAvailableSlots()
  }, [currentWeek, lessonType?.durationMinutes])

  const fetchAvailableSlots = async () => {
    setLoading(true)
    try {
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
      const dateKeys = weekDates.map(d => format(d, 'yyyy-MM-dd'))

      // Use precise visible-slots API to compute slots strictly from DB
      const response = await fetch(`/api/booking/visible-slots?dates=${encodeURIComponent(dateKeys.join(','))}`)
      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.slots)
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Ett fel uppstod vid hämtning av tillgängliga tider')
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
    if (selectedDate && isSameDay(selectedDate, date)) {
      // If clicking the same date, clear selection
      setSelectedDate(null)
      setSelectedTime(null)
    } else {
      // Select new date and clear time
      setSelectedDate(date)
      setSelectedTime(null)
    }
  }

  const handleTimeSelect = async (time: string) => {
    if (selectedDate) {
      setSelectedTime(time)
      setLoading(true)

      try {
        // Create temporary booking to hold the timeslot
        const response = await fetch('/api/booking/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionType: 'lesson',
            sessionId: lessonType.id,
            scheduledDate: selectedDate.toISOString().split('T')[0],
            startTime: time,
            endTime: calculateEndTime(time, lessonType.durationMinutes),
            durationMinutes: lessonType.durationMinutes,
            transmissionType: transmissionType,
            totalPrice: totalPrice,
            paymentMethod: 'temp', // Mark as temporary
            status: 'temp', // Explicitly set status to temp
            // Use dummy information for temporary booking
            guestName: 'Temporary',
            guestEmail: `orderid-${Date.now()}@dintrafikskolahlm.se`,
            guestPhone: '0000000000'
          })
        })

        const data = await response.json()
        
        if (response.ok && data.booking) {
          console.log('Temporary booking created:', data.booking)
          toast.success('Tid bokad! Fortsätt till bekräftelse.')
          // Pass booking ID to parent component
          onComplete({ 
            selectedDate, 
            selectedTime: time, 
            bookingId: data.booking.id 
          })
        } else {
          console.error('Booking creation failed:', data.error)
          
          // Show specific error messages based on the error
          if (data.error?.includes('redan bokad')) {
            toast.error('Denna tid är redan bokad. Välj en annan tid.')
            // Refresh slots to get updated availability
            await fetchAvailableSlots()
          } else if (data.error?.includes('blockerad')) {
            toast.error('Denna tid är blockerad och kan inte bokas.')
            // Refresh slots to get updated availability
            await fetchAvailableSlots()
          } else if (data.error?.includes('3 timmar')) {
            toast.error('Bokningar måste göras minst 3 timmar i förväg.')
            // Refresh slots to get updated availability
            await fetchAvailableSlots()
          } else if (data.error?.includes('förflutna')) {
            toast.error('Kan inte boka ett datum i det förflutna.')
            // Refresh slots to get updated availability
            await fetchAvailableSlots()
          } else {
            toast.error('Ett fel uppstod vid bokning. Försök igen.')
            // Refresh slots to get updated availability
            await fetchAvailableSlots()
          }
          
          // Clear the selected time since booking failed
          setSelectedTime(null)
        }
      } catch (error) {
        console.error('Error creating booking:', error)
        toast.error('Ett fel uppstod vid bokning. Kontrollera din internetanslutning och försök igen.')
        // Refresh slots to get updated availability
        await fetchAvailableSlots()
        // Clear the selected time since booking failed
        setSelectedTime(null)
      } finally {
        setLoading(false)
      }
    }
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const handleNextWeek = () => {
    const nextWeek = addWeeks(currentWeek, 1)
    setCurrentWeek(startOfWeek(nextWeek, { weekStartsOn: 1 }))
  }

  const handlePrevWeek = () => {
    const prevWeek = addWeeks(currentWeek, -1)
    setCurrentWeek(startOfWeek(prevWeek, { weekStartsOn: 1 }))
  }

  const canProceed = selectedDate && selectedTime

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj datum och tid</h2>
            <p className="text-gray-600">Välj en ledig tid för din körlektion</p>
            
            {/* Status Legend */}
            <div className="flex justify-center items-center gap-6 mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Tillgänglig</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Tillfälligt bokad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Bokad/Otillgänglig</span>
              </div>
            </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
            {weekDays.map((day) => {
              const isSelected = selectedDate && isSameDay(selectedDate, day.date)
              const daySlots = availableSlots[day.dateKey]
              const availableCount = daySlots ? daySlots.filter(slot => slot.available).length : 0
              const hasAvailableSlots = availableCount > 0
              const isSlotDataLoaded = daySlots !== undefined
              const isCurrentlyLoading = loading && !isSlotDataLoaded

              return (
                <div
                  key={day.dateKey}
                  className={`
                    p-3 rounded-lg text-center transition-all border-2
                    ${isSelected 
                      ? 'bg-red-600 text-white border-red-600 cursor-pointer' 
                      : hasAvailableSlots
                        ? 'bg-white hover:bg-gray-50 border-gray-200 hover:border-red-300 shadow-sm cursor-pointer'
                        : isCurrentlyLoading
                          ? 'bg-gray-50 border-gray-200 cursor-wait'
                          : 'bg-gray-100 opacity-50 cursor-not-allowed border-gray-200'
                    }
                  `}
                  onClick={() => hasAvailableSlots && handleDateSelect(day.date)}
                >
                  <div className="text-xs font-medium mb-1">{day.dayName}</div>
                  <div className="text-lg font-bold">{day.dayNumber}</div>
                  <div className="text-xs">{day.month}</div>
                  {isCurrentlyLoading && (
                    <div className="text-xs mt-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Kontrollerar...
                    </div>
                  )}
                  {!isCurrentlyLoading && hasAvailableSlots && (
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                      isSelected 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {availableCount} {availableCount === 1 ? 'tid' : 'tider'}
                    </div>
                  )}
                  {!isCurrentlyLoading && isSlotDataLoaded && !hasAvailableSlots && (
                    <div className="text-xs mt-1 px-2 py-1 rounded-full bg-gray-200 text-gray-500">
                      Ej tillgänglig
                    </div>
                  )}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(availableSlots[format(selectedDate, 'yyyy-MM-dd')] || [])
                    .map((slot) => {
                      const raw = slot.time as string
                      const hhmm = typeof raw === 'string' ? raw.slice(0, 5) : String(raw).slice(0, 5)
                      const display = hhmm.replace(':', '.')
                      
                      // Determine button styling based on slot status
                      let buttonClasses = "relative transition-all duration-200 font-medium text-sm h-20 flex flex-col justify-between overflow-hidden "
                      let isDisabled = !slot.clickable
                      let statusBarColor = ""
                      
                      if (selectedTime === slot.time) {
                        buttonClasses += "bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 shadow-lg"
                        statusBarColor = "bg-red-800"
                      } else if (slot.gradient === 'green' && slot.clickable) {
                        buttonClasses += "bg-white border-2 border-green-500 hover:border-green-600 hover:bg-green-50 text-green-700 shadow-sm hover:shadow-md"
                        statusBarColor = "bg-green-500"
                      } else if (slot.gradient === 'orange') {
                        buttonClasses += "bg-orange-50 border-2 border-orange-400 text-orange-700 cursor-not-allowed opacity-75"
                        statusBarColor = "bg-orange-500"
                      } else if (slot.gradient === 'red' || !slot.clickable) {
                        buttonClasses += "bg-gray-100 border-2 border-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                        statusBarColor = "bg-gray-400"
                      }
                      
                      return (
                        <Button
                          key={raw}
                          variant="outline"
                          size="sm"
                          disabled={isDisabled}
                          onClick={() => slot.clickable && handleTimeSelect(hhmm)}
                          className={buttonClasses}
                        >
                          <div className="flex flex-col items-center justify-center flex-1 py-1">
                            <span className="font-bold text-base">{display}</span>
                            {slot.callForBooking && slot.callPhone && (
                              <span className="text-[9px] font-medium text-center leading-tight">Ring: {slot.callPhone}</span>
                            )}
                          </div>
                          {/* Status bottom line */}
                          <div className={`absolute bottom-0 left-0 right-0 h-1 ${statusBarColor}`}></div>
                          {/* Status text overlay */}
                          <div className="absolute bottom-1 left-0 right-0">
                            <div className={`text-[9px] font-semibold text-center px-1 py-0.5 mx-1 rounded-sm ${
                              selectedTime === slot.time 
                                ? 'bg-red-800 text-white' 
                                : slot.gradient === 'green' 
                                  ? 'bg-green-100 text-green-800' 
                                  : slot.gradient === 'orange'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                              {slot.statusText || (slot.callForBooking ? 'Ring för bokning' : 'Okänd status')}
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Tillbaka
            </Button>
            {canProceed && (
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Vald tid: {selectedDate && selectedTime && 
                    `${format(selectedDate, 'EEEE d MMMM', { locale: sv })} kl ${selectedTime}`
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Klicka på en tid för att fortsätta till bekräftelse
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
