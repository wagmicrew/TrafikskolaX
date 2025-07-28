import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots } from '@/lib/db/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const lessonTypeId = searchParams.get('lessonTypeId');
    const duration = parseInt(searchParams.get('duration') || '45');

    if (!date || !lessonTypeId) {
      return NextResponse.json({ error: 'Date and lessonTypeId are required' }, { status: 400 });
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    // Get slot settings for the day
    const daySlots = await db
      .select()
      .from(slotSettings)
      .where(and(eq(slotSettings.dayOfWeek, dayOfWeek), eq(slotSettings.isActive, true)));

    // Get existing bookings for the date (excluding soft deleted)
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.scheduledDate, date),
          or(eq(bookings.status, 'on_hold'), eq(bookings.status, 'booked'), eq(bookings.status, 'confirmed'))
        )
      );

    // Get blocked slots for the date
    const blockedSlotsList = await db
      .select()
      .from(blockedSlots)
      .where(eq(blockedSlots.date, date));

    // Calculate available slots
    const availableSlots = [];
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    for (const slot of daySlots) {
      // Check if slot is blocked
      const isBlocked = blockedSlotsList.some((blocked) => {
        if (blocked.isAllDay) return true;
        if (!blocked.timeStart || !blocked.timeEnd) return false;
        return slot.timeStart >= blocked.timeStart && slot.timeEnd <= blocked.timeEnd;
      });

      if (isBlocked) continue;

      // Check if slot has existing bookings
      const hasBooking = existingBookings.some((booking) => {
        // Exclude on_hold bookings older than 10 minutes
        if (booking.status === 'on_hold' && booking.createdAt < tenMinutesAgo) {
          return false;
        }

        // Check time overlap
        return (
          (booking.startTime >= slot.timeStart && booking.startTime < slot.timeEnd) ||
          (booking.endTime > slot.timeStart && booking.endTime <= slot.timeEnd) ||
          (booking.startTime <= slot.timeStart && booking.endTime >= slot.timeEnd)
        );
      });

      if (!hasBooking) {
        availableSlots.push({
          timeStart: slot.timeStart,
          timeEnd: slot.timeEnd,
        });
      }
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 });
  }
}
