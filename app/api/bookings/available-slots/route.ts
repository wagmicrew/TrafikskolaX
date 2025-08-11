import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots } from '@/lib/db/schema';
import { eq, sql, and, gte, lte, not } from 'drizzle-orm';
import { parseISO, format, addDays, getDay } from 'date-fns';
import { doesAnyBookingOverlapWithSlot } from '@/lib/utils/time-overlap';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const selectedDate = parseISO(dateParam);
    const dayOfWeek = getDay(selectedDate);

    // Get slot settings for the selected day
    const settings = await db
      .select()
      .from(slotSettings)
      .where(eq(slotSettings.dayOfWeek, dayOfWeek));

    if (!settings || settings.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Get existing bookings for the selected date (including temporary bookings)
    const existingBookings = await db
      .select({
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.scheduledDate, selectedDate),
          not(eq(bookings.status, 'cancelled'))
        )
      );

    // Get blocked slots for the selected date
    const blocked = await db
      .select()
      .from(blockedSlots)
      .where(eq(blockedSlots.date, selectedDate));

    // Build available slots
    const availableSlots: Array<{ startTime: string; endTime: string }> = [];

    for (const setting of settings) {
      if (setting.isBlocked) continue;

      const startTime = setting.startTime;
      const endTime = setting.endTime;

      // Check if this time slot overlaps with any blocked slot
      const isBlocked = blocked.some(block => {
        if (!block.timeStart || !block.timeEnd) return block.isAllDay;
        return (
          (block.timeStart <= startTime && block.timeEnd > startTime) ||
          (block.timeStart < endTime && block.timeEnd >= endTime) ||
          (block.timeStart >= startTime && block.timeEnd <= endTime)
        );
      });

      if (isBlocked) continue;

      // Check if this time slot is already booked
      const isBooked = doesAnyBookingOverlapWithSlot(
        existingBookings,
        startTime,
        endTime,
        true // exclude expired bookings
      );

      if (!isBooked) {
        availableSlots.push({
          startTime,
          endTime,
        });
      }
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
