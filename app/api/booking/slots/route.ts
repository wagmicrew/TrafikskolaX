import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots } from '@/lib/db/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const duration = parseInt(searchParams.get('duration') || '45');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const slotsForWeek = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();

      try {
        // Get slot settings for the day
        const daySlots = await db
          .select()
          .from(slotSettings)
          .where(and(eq(slotSettings.dayOfWeek, dayOfWeek), eq(slotSettings.isActive, true)));

        // Get existing bookings for the date
        const existingBookings = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.scheduledDate, dateStr),
              or(
                eq(bookings.status, 'on_hold'), 
                eq(bookings.status, 'booked'), 
                eq(bookings.status, 'confirmed')
              )
            )
          );

        // Get blocked slots for the date
        const blockedSlotsList = await db
          .select()
          .from(blockedSlots)
          .where(eq(blockedSlots.date, dateStr));

        // Process slots for this day
        const timeSlots = [];
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        for (const slot of daySlots) {
          // Check if entire day is blocked
          const isAllDayBlocked = blockedSlotsList.some(blocked => blocked.isAllDay);
          if (isAllDayBlocked) continue;

          // Check if this specific slot is blocked
          const isSlotBlocked = blockedSlotsList.some((blocked) => {
            if (!blocked.timeStart || !blocked.timeEnd) return false;
            return slot.timeStart >= blocked.timeStart && slot.timeEnd <= blocked.timeEnd;
          });

          if (isSlotBlocked) continue;

          // Check if slot has existing bookings
          const hasBooking = existingBookings.some((booking) => {
            // Exclude expired on_hold bookings
            if (booking.status === 'on_hold' && new Date(booking.createdAt) < tenMinutesAgo) {
              return false;
            }

            // Check time overlap
            return (
              (booking.startTime >= slot.timeStart && booking.startTime < slot.timeEnd) ||
              (booking.endTime > slot.timeStart && booking.endTime <= slot.timeEnd) ||
              (booking.startTime <= slot.timeStart && booking.endTime >= slot.timeEnd)
            );
          });

          // Add slot to available times
          timeSlots.push({
            time: slot.timeStart,
            available: !hasBooking
          });
        }

        slotsForWeek[dateStr] = timeSlots;

      } catch (dayError) {
        console.error(`Error processing date ${dateStr}:`, dayError);
        slotsForWeek[dateStr] = [];
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({ 
      success: true, 
      slots: slotsForWeek 
    });

  } catch (error) {
    console.error('Error fetching booking slots:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch booking slots', 
      details: error.message 
    }, { status: 500 });
  }
}
