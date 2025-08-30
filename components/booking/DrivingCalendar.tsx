'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';

interface LessonType {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  priceStudent?: number;
  isActive: boolean;
}

interface SlotData {
  date: string;
  time: string;
  available: boolean;
  status: 'available' | 'booked' | 'blocked' | 'extra';
}

interface DrivingCalendarProps {
  lessonType: LessonType;
  onSlotSelect: (date: string, time: string) => void;
}

export function DrivingCalendar({ lessonType, onSlotSelect }: DrivingCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, lessonType.id]);

  const loadAvailableSlots = async (date: Date) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/slots/available?date=${format(date, 'yyyy-MM-dd')}&lessonTypeId=${lessonType.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        console.error('Failed to load slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot: SlotData) => {
    if (slot.available && slot.status === 'available') {
      onSlotSelect(slot.date, slot.time);
    }
  };

  const getSlotColor = (slot: SlotData) => {
    switch (slot.status) {
      case 'available':
        return 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200';
      case 'booked':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'blocked':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'extra':
        return 'bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getSlotIcon = (slot: SlotData) => {
    switch (slot.status) {
      case 'available':
      case 'extra':
        return <CheckCircle className="w-4 h-4" />;
      case 'booked':
        return <XCircle className="w-4 h-4" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'next'
      ? addDays(currentWeekStart, 7)
      : addDays(currentWeekStart, -7);
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(null);
    setAvailableSlots([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Välj datum och tid för {lessonType.name}
        </h2>
        <p className="text-lg text-gray-600">
          Klicka på ett datum för att se tillgängliga tider
        </p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <Button
          variant="outline"
          onClick={() => navigateWeek('prev')}
          className="flex items-center space-x-2"
        >
          ← Föregående vecka
        </Button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Vecka {format(currentWeekStart, 'w, yyyy', { locale: sv })}
          </h3>
          <p className="text-sm text-gray-600">
            {format(currentWeekStart, 'd MMM', { locale: sv })} - {format(addDays(currentWeekStart, 6), 'd MMM', { locale: sv })}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigateWeek('next')}
          className="flex items-center space-x-2"
        >
          Nästa vecka →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Välj datum</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, index) => {
                const dayName = format(date, 'EEE', { locale: sv });
                const dayNumber = format(date, 'd');
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      p-3 rounded-lg border-2 text-center transition-colors
                      ${isSelected
                        ? 'bg-red-600 text-white border-red-600'
                        : isTodayDate
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="text-xs font-medium">{dayName}</div>
                    <div className="text-lg font-bold">{dayNumber}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>
                {selectedDate
                  ? `Tillgängliga tider för ${format(selectedDate, 'd MMM', { locale: sv })}`
                  : 'Välj ett datum för att se tider'
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Välj ett datum till vänster för att se tillgängliga tider</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Laddar tillgängliga tider...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Inga tillgängliga tider för detta datum</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available || slot.status === 'booked' || slot.status === 'blocked'}
                    className={`
                      p-3 rounded-lg border-2 flex items-center justify-center space-x-2 text-sm font-medium transition-colors
                      ${getSlotColor(slot)}
                      ${slot.available && (slot.status === 'available' || slot.status === 'extra')
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-60'
                      }
                    `}
                  >
                    {getSlotIcon(slot)}
                    <span>{slot.time}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Tillgänglig</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Extra tid</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Upptagen</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Blockerad</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 mb-1">Viktig information</h4>
            <ul className="text-amber-700 text-sm space-y-1">
              <li>• Bokningar kan göras upp till 2 timmar innan lektionen</li>
              <li>• Extra tider kan bokas med kort varsel</li>
              <li>• Du måste bekräfta din bokning inom 10 minuter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
