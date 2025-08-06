"use client";

import React, { useMemo } from 'react';
import { Clock, Plus } from 'lucide-react';

interface TimeSlot {
  id: string;
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  adminMinutes: number;
  isActive: boolean;
}

interface WeeklyCalendarProps {
  slots: TimeSlot[];
  onEdit: (slot: TimeSlot, event: React.MouseEvent) => void;
  onAdd: (value: boolean) => void;
  currentWeek: Date;
  onRightClick?: (slot: TimeSlot, event: React.MouseEvent) => void;
  onDrag?: (slot: TimeSlot, newTime: { start: string; end: string; day: number }) => void;
  onResize?: (slot: TimeSlot, newTime: { start: string; end: string }) => void;
}

const DAYS_OF_WEEK = [
  'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'
];

// Generate time slots in 5-minute intervals from 6:00 to 23:55
const generateTimeSlots = () => {
  const slots: Array<{hour: number, minute: number, display: string}> = [];
  for (let hour = 6; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      // Skip times after 23:55
      if (hour === 23 && minute > 55) break;
      slots.push({
        hour,
        minute,
        display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      });
    }
  }
  return slots;
};

export default function WeeklyCalendar({ 
  slots, 
  onEdit, 
  onAdd, 
  currentWeek, 
  onRightClick, 
  onDrag, 
  onResize 
}: WeeklyCalendarProps) {
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  
  const getSlotForDayAndTime = (day: number, hour: number, minute: number) => {
    return slots.filter((slot: TimeSlot) => {
      // First check if the slot is for the correct day
      if (slot.dayOfWeek !== day) return false;
      
      // Parse slot times
      const [slotStartHour, slotStartMinute] = slot.timeStart.split(':').map(Number);
      const [slotEndHour, slotEndMinute] = slot.timeEnd.split(':').map(Number);
      
      // Convert all times to minutes since midnight for easier comparison
      const slotStart = slotStartHour * 60 + slotStartMinute;
      const slotEnd = slotEndHour * 60 + slotEndMinute;
      const currentTime = hour * 60 + minute;
      
      // A slot should be shown at this time if:
      // 1. The current time is exactly the start time of the slot, or
      // 2. The current time is within the slot's duration (for multi-hour slots)
      const isStartOfSlot = (slotStartHour === hour && slotStartMinute === minute);
      const isWithinSlot = (currentTime > slotStart && currentTime < slotEnd);
      
      // For debugging
      if (isStartOfSlot || isWithinSlot) {
        console.log('Matching slot:', {
          slot,
          currentTime: `${hour}:${minute.toString().padStart(2, '0')}`,
          slotTime: `${slotStartHour}:${slotStartMinute.toString().padStart(2, '0')}-${slotEndHour}:${slotEndMinute.toString().padStart(2, '0')}`,
          isStartOfSlot,
          isWithinSlot
        });
      }
      
      return isStartOfSlot || isWithinSlot;
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Veckoöversikt
        </h3>
        <button
          onClick={() => onAdd(true)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Lägg till tidslucka
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="text-sm font-medium text-gray-600 p-2">Tid</div>
            {DAYS_OF_WEEK.map((day, index) => (
              <div key={index} className="text-sm font-medium text-gray-700 p-2 text-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="border-t">
            {timeSlots.map(({ hour, minute, display }) => {
              // Only show the hour label once per hour
              const showHourLabel = minute === 0;
              
              return (
                <div 
                  key={`${hour}-${minute}`} 
                  className="grid grid-cols-8 gap-1 border-b" 
                  style={{ height: '24px' }}
                >
                  <div className="text-xs text-gray-600 p-1">
                    {showHourLabel ? display : ''}
                  </div>
                  
                  {DAYS_OF_WEEK.map((_, dayIndex) => {
                    const daySlots = getSlotForDayAndTime(dayIndex, hour, minute);
                    
                    return (
                      <div 
                        key={dayIndex} 
                        className="relative p-0.5 min-h-[24px] border-t border-gray-100"
                      >
                        {daySlots.map((slot: TimeSlot) => {
                          // Only render the slot at its start time (top of the slot)
                          const [startHour, startMinute] = slot.timeStart.split(':').map(Number);
                          
                          if (startHour === hour && startMinute === minute) {
                            const [endHour, endMinute] = slot.timeEnd.split(':').map(Number);
                            const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                            const rowSpan = Math.max(1, Math.ceil(duration / 5));
                            
                            console.log('Rendering slot:', {
                              slot,
                              startTime: `${startHour}:${startMinute.toString().padStart(2, '0')}`,
                              endTime: `${endHour}:${endMinute.toString().padStart(2, '0')}`,
                              duration,
                              rowSpan
                            });
                            
                            return (
                              <div
                                key={slot.id}
                                onClick={(e) => onEdit(slot, e)}
                                className={`absolute rounded border text-xs p-0.5 overflow-hidden cursor-pointer transition-colors ${
                                  slot.isActive 
                                    ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300'
                                }`}
                                style={{
                                  height: `${rowSpan * 24}px`,
                                  width: 'calc(100% - 4px)',
                                  top: '2px',
                                  left: '2px',
                                  zIndex: 10,
                                }}
                                onContextMenu={(e) => {
                                  if (onRightClick) {
                                    e.preventDefault();
                                    onRightClick(slot, e);
                                  }
                                }}
                              >
                                <div className="font-semibold truncate">
                                  {formatTime(slot.timeStart)} - {formatTime(slot.timeEnd)}
                                </div>
                                {slot.adminMinutes > 0 && (
                                  <div className="text-[10px] opacity-75">
                                    +{slot.adminMinutes} min admin
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
