import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots } from '@/lib/db/schema';
import { eq, sql, and, gte, lte, not } from 'drizzle-orm';
import { parseISO, format, addDays, getDay } from 'date-fns';

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

    // Get existing bookings for the selected date
    const existingBookings = await db
      .select({
        startTime: bookings.startTime,
        endTime: bookings.endTime,
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
      .where(
        and(
          lte(blockedSlots.startDate, selectedDate),
          gte(blockedSlots.endDate, selectedDate)
        )
      );

    // Build available slots
    const availableSlots: Array<{ startTime: string; endTime: string }> = [];

    for (const setting of settings) {
      if (setting.isBlocked) continue;

      const startTime = setting.startTime;
      const endTime = setting.endTime;

      // Check if this time slot overlaps with any blocked slot
      const isBlocked = blocked.some(block => {
        if (!block.startTime || !block.endTime) return false;
        return (
          (block.startTime <= startTime && block.endTime > startTime) ||
          (block.startTime < endTime && block.endTime >= endTime) ||
          (block.startTime >= startTime && block.endTime <= endTime)
        );
      });

      if (isBlocked) continue;

      // Check if this time slot is already booked
      const isBooked = existingBookings.some(booking => {
        return booking.startTime === startTime && booking.endTime === endTime;
      });

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
