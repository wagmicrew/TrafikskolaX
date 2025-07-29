import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots } from '@/lib/db/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const lessonTypeId = searchParams.get('lessonTypeId');
    const duration = parseInt(searchParams.get('duration') || '45');

    if (!startDate || !endDate || !lessonTypeId) {
      return NextResponse.json({ error: 'Date and lessonTypeId are required' }, { status: 400 });
    }

    const slotsForWeek = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start);

    while (current <= end) {
      const date = current.toISOString().split('T')[0];
      const dayOfWeek = current.getUTCDay();

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

      // Calculate available slots for the day
      const availableSlots = daySlots.filter((slot) => {
        const isBlocked = blockedSlotsList.some((blocked) => {
          if (blocked.isAllDay) return true;
          if (!blocked.timeStart || !blocked.timeEnd) return false;
          return slot.timeStart >= blocked.timeStart && slot.timeEnd <= blocked.timeEnd;
        });

        if (isBlocked) return false;

        const hasBooking = existingBookings.some((booking) => {
          // Exclude on_hold bookings older than 10 minutes
          if (booking.status === 'on_hold' && new Date(booking.createdAt) < new Date(Date.now() - 10 * 60 * 1000))
            return false;

          // Check time overlap
          return (
            (booking.startTime >= slot.timeStart && booking.startTime < slot.timeEnd) ||
            (booking.endTime > slot.timeStart && booking.endTime <= slot.timeEnd) ||
            (booking.startTime <= slot.timeStart && booking.endTime >= slot.timeEnd)
          );
        });

        return !hasBooking;
      }).map((slot) => ({
        timeStart: slot.timeStart,
        timeEnd: slot.timeEnd,
      }));

      slotsForWeek[date] = availableSlots;

      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({ success: true, slots: slotsForWeek });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 });
  }
}
