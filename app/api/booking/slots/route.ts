import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots, extraSlots, siteSettings, lessonTypes } from '@/lib/db/schema';
import { eq, and, gte, lte, or, inArray } from 'drizzle-orm';
import { doesAnyBookingOverlapWithSlot, doTimeRangesOverlap } from '@/lib/utils/time-overlap';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const duration = parseInt(searchParams.get('duration') || '45');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const slotsForWeek: Record<string, any[]> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date().toISOString().split('T')[0];
    
    // Set booking start date to August 18th, 2025
    const bookingStartDate = '2025-08-18';
    
    // Optionally read an opening date and contact phone from site settings
    let bookingOpenFrom: string | null = null;
    let contactPhone: string | null = null;
    try {
      const settings = await db
        .select()
        .from(siteSettings)
        .where(inArray(siteSettings.key, ['booking_open_from', 'contact_phone']))
      if (settings && settings.length) {
        for (const s of settings) {
          if (s.key === 'booking_open_from' && s.value) bookingOpenFrom = String(s.value);
          if (s.key === 'contact_phone' && s.value) contactPhone = String(s.value);
        }
      }
    } catch {}

    // Use the booking start date if no site setting is found
    if (!bookingOpenFrom) {
      bookingOpenFrom = bookingStartDate;
    }

    // Generate array of all dates in the range
    const dateArray = [];
    let current = new Date(start);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Skip past dates and dates before opening date (if configured)
      if (dateStr < today || (bookingOpenFrom && dateStr < bookingOpenFrom)) {
        slotsForWeek[dateStr] = [];
        current.setDate(current.getDate() + 1);
        continue;
      }
      
      dateArray.push({
        dateStr,
        dayOfWeek: current.getDay()
      });
      current.setDate(current.getDate() + 1);
    }

    if (dateArray.length === 0) {
      // All dates are blocked or in the past
      return NextResponse.json({ 
        success: true, 
        slots: slotsForWeek 
      });
    }

    // Fetch all slot settings for the week's days in one query
    const uniqueDaysOfWeek = [...new Set(dateArray.map(d => d.dayOfWeek))];
    const allSlotSettings = await db
      .select()
      .from(slotSettings)
      .where(and(
        inArray(slotSettings.dayOfWeek, uniqueDaysOfWeek),
        eq(slotSettings.isActive, true)
      ));

    // Fetch ALL bookings for the date range - including temporary bookings, excluding cancelled
    const dateStrings = dateArray.map(d => d.dateStr);
    const allBookings = await db
      .select({
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        createdAt: bookings.createdAt,
        lessonTypeName: lessonTypes.name
      })
      .from(bookings)
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(
        and(
          inArray(bookings.scheduledDate, dateStrings),
          // Exclude cancelled bookings from blocking
          or(eq(bookings.status, 'temp'), eq(bookings.status, 'on_hold'), eq(bookings.status, 'booked'), eq(bookings.status, 'confirmed'))
        )
      );

    // Fetch all blocked slots for the date range in one query
    const allBlockedSlots = await db
      .select()
      .from(blockedSlots)
      .where(inArray(blockedSlots.date, dateStrings));

    // Fetch all extra slots for the date range
    const allExtraSlots = await db
      .select()
      .from(extraSlots)
      .where(inArray(extraSlots.date, dateStrings));

    // Pre-compute time-based constants
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Group data by date for efficient lookup
    const slotSettingsByDay: Record<number, any[]> = {};
    allSlotSettings.forEach(slot => {
      if (!slotSettingsByDay[slot.dayOfWeek]) {
        slotSettingsByDay[slot.dayOfWeek] = [];
      }
      slotSettingsByDay[slot.dayOfWeek].push(slot);
    });

    const bookingsByDate: Record<string, any[]> = {};
    allBookings.forEach(booking => {
      const dateKey = (booking.scheduledDate instanceof Date)
        ? booking.scheduledDate.toISOString().split('T')[0]
        : String(booking.scheduledDate).slice(0, 10);
      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = [];
      }
      bookingsByDate[dateKey].push(booking);
    });

    const blockedSlotsByDate: Record<string, any[]> = {};
    allBlockedSlots.forEach(blocked => {
      const dateKey = blocked.date;
      if (!blockedSlotsByDate[dateKey]) {
        blockedSlotsByDate[dateKey] = [];
      }
      blockedSlotsByDate[dateKey].push(blocked);
    });

    const extraSlotsByDate: Record<string, any[]> = {};
    allExtraSlots.forEach(extra => {
      const dateKey = extra.date;
      if (!extraSlotsByDate[dateKey]) {
        extraSlotsByDate[dateKey] = [];
      }
      extraSlotsByDate[dateKey].push(extra);
    });

    // Process each date
    for (const { dateStr, dayOfWeek } of dateArray) {
      try {
        const daySlots = slotSettingsByDay[dayOfWeek] || [];
        const existingBookings = bookingsByDate[dateStr] || [];
        // Ignore handledar utbildning bookings when blocking
        const blockingBookings = existingBookings; // use all bookings to strictly block
        const blockedSlotsList = blockedSlotsByDate[dateStr] || [];
        const extraSlotsList = extraSlotsByDate[dateStr] || [];

        // Process slots for this day
        const timeSlots = [];

        for (const slot of daySlots) {
          // Check if entire day is blocked
          const isAllDayBlocked = blockedSlotsList.some(blocked => blocked.isAllDay);
          if (isAllDayBlocked) continue;

          // Check if this specific slot overlaps with any blocked interval
          const isSlotBlocked = blockedSlotsList.some((blocked) => {
            if (!blocked.timeStart || !blocked.timeEnd) return false;
            return doTimeRangesOverlap(
              slot.timeStart,
              slot.timeEnd,
              blocked.timeStart,
              blocked.timeEnd
            );
          });

          if (isSlotBlocked) continue;

          // Check if slot has existing bookings - include ALL bookings (temp, confirmed, etc.)
          const hasBooking = doesAnyBookingOverlapWithSlot(
            existingBookings,
            slot.timeStart,
            slot.timeEnd,
            false
          );

          // Check if this slot is within 2 hours from now
          const slotDateTime = new Date(`${dateStr}T${slot.timeStart}`);
          const isWithinTwoHours = slotDateTime <= twoHoursFromNow;
          
          // Determine availability strictly: only expose slots with no booking
          const isAvailable = !hasBooking && !isWithinTwoHours;
          const isUnavailable = hasBooking || isWithinTwoHours;
          
          // Add slot to available times with gradient information
          timeSlots.push({
            time: slot.timeStart,
            available: isAvailable,
            unavailable: isUnavailable,
            hasBooking: hasBooking,
            isWithinTwoHours: isWithinTwoHours,
            callForBooking: isWithinTwoHours,
            callPhone: isWithinTwoHours ? (contactPhone || undefined) : undefined,
            gradient: isAvailable ? 'green' : 'red',
            clickable: !hasBooking && !isWithinTwoHours
          });
        }

        // Add extra slots for this date
        for (const extraSlot of extraSlotsList) {
          // Check if this extra slot overlaps with any existing bookings
          const hasBooking = doesAnyBookingOverlapWithSlot(
            existingBookings,
            extraSlot.timeStart,
            extraSlot.timeEnd,
            false
          );

          // Check if this slot is within 2 hours from now
          const slotDateTime = new Date(`${dateStr}T${extraSlot.timeStart}`);
          const isWithinTwoHours = slotDateTime <= twoHoursFromNow;
          
          // Determine availability strictly: only expose slots with no booking
          const isAvailable = !hasBooking && !isWithinTwoHours;
          const isUnavailable = hasBooking || isWithinTwoHours;
          
          // Add extra slot to available times
          timeSlots.push({
            time: extraSlot.timeStart,
            available: isAvailable,
            unavailable: isUnavailable,
            hasBooking: hasBooking,
            isWithinTwoHours: isWithinTwoHours,
            callForBooking: isWithinTwoHours,
            callPhone: isWithinTwoHours ? (contactPhone || undefined) : undefined,
            gradient: isAvailable ? 'green' : 'red',
            clickable: !hasBooking && !isWithinTwoHours, // strict clickable rule
            isExtraSlot: true, // mark as extra slot
            reason: extraSlot.reason // include reason if available
          });
        }

        // Sort slots by time
        timeSlots.sort((a, b) => a.time.localeCompare(b.time));

        slotsForWeek[dateStr] = timeSlots;

      } catch (dayError) {
        console.error(`Error processing date ${dateStr}:`, dayError);
        slotsForWeek[dateStr] = [];
      }
    }

    return NextResponse.json({ 
      success: true, 
      slots: slotsForWeek 
    });

  } catch (error) {
    console.error('Error fetching booking slots:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch booking slots', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
