"use client";

import React from 'react';
import { Ban, Plus } from 'lucide-react';

interface BlockedSlot {
  id: string;
  date: string;
  timeStart: string | null;
  timeEnd: string | null;
  isAllDay: boolean;
  reason: string | null;
}

interface BlockedSlotsCalendarProps {
  blockedSlots: BlockedSlot[];
  onEdit: (slot: BlockedSlot, event: React.MouseEvent) => void;
  onAdd: (event: React.MouseEvent, date?: string) => void;
  currentWeek: Date;
}

export default function BlockedSlotsCalendar({ blockedSlots, onEdit, onAdd, currentWeek }: BlockedSlotsCalendarProps) {
  // Get the start of current week (Monday) from props
  const getWeekStart = (date: Date) => {
    const newDate = new Date(date);
    const day = newDate.getDay();
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    return new Date(newDate.setDate(diff));
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const getDayName = (date: Date) => {
    const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
    return days[date.getDay()];
  };

  const getBlockedSlotsForDate = (date: string) => {
    return blockedSlots.filter(slot => slot.date === date);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-500" />
          Blockerade tider denna vecka
        </h3>
        <button
          onClick={(e) => onAdd(e)}
          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Blockera tid
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, index) => {
          const dateStr = formatDate(date);
          const daySlots = getBlockedSlotsForDate(dateStr);
          const isToday = dateStr === formatDate(new Date());
          
          return (
            <div
              key={index}
              className={`border rounded-lg p-2 min-h-[120px] cursor-pointer ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
              }`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onAdd(e, dateStr);
              }}
            >
              <div className="font-medium text-sm mb-2 text-center">
                {getDayName(date)}
                <div className="text-xs text-gray-500">
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
              </div>
              
              <div className="space-y-1">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={(e) => onEdit(slot, e)}
                    className="bg-red-100 hover:bg-red-200 p-1 rounded text-xs cursor-pointer border border-red-300"
                  >
                    {slot.isAllDay ? (
                      <div className="font-semibold text-red-800">Hela dagen</div>
                    ) : (
                      <div className="font-semibold text-red-800">
                        {formatTime(slot.timeStart)} - {formatTime(slot.timeEnd)}
                      </div>
                    )}
                    {slot.reason && (
                      <div className="text-[10px] text-red-600 truncate">
                        {slot.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
