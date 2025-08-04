"use client";

import React from 'react';
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

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

export default function WeeklyCalendar({ slots, onEdit, onAdd, currentWeek, onRightClick, onDrag, onResize }: WeeklyCalendarProps) {
  const getSlotForDayAndTime = (day: number, hour: number) => {
    return slots.filter(slot => {
      const startHour = parseInt(slot.timeStart.split(':')[0]);
      const endHour = parseInt(slot.timeEnd.split(':')[0]);
      const endMinute = parseInt(slot.timeEnd.split(':')[1]);
      const actualEndHour = endMinute > 0 ? endHour : endHour;
      
      return slot.dayOfWeek === day && startHour <= hour && hour < actualEndHour;
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
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-1 border-b">
                <div className="text-sm text-gray-600 p-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {DAYS_OF_WEEK.map((_, dayIndex) => {
                  const daySlots = getSlotForDayAndTime(dayIndex, hour);
                  
                  return (
                    <div key={dayIndex} className="p-1 min-h-[40px]">
                      {daySlots.map(slot => {
                        const startHour = parseInt(slot.timeStart.split(':')[0]);
                        if (startHour === hour) {
                          const duration = 
                            (parseInt(slot.timeEnd.split(':')[0]) * 60 + parseInt(slot.timeEnd.split(':')[1])) -
                            (parseInt(slot.timeStart.split(':')[0]) * 60 + parseInt(slot.timeStart.split(':')[1]));
                          const height = Math.max(30, (duration / 60) * 40);
                          
                          return (
                            <div
                              key={slot.id}
                              onClick={(e) => onEdit(slot, e)}
                              onContextMenu={(e) => {
                                if (onRightClick) {
                                  e.preventDefault();
                                  onRightClick(slot, e);
                                }
                              }}
                              className={`
                                p-1 rounded text-xs cursor-pointer transition-colors
                                ${slot.isActive 
                                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                                }
                              `}
                              style={{ minHeight: `${height}px` }}
                            >
                              <div className="font-semibold">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
