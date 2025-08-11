import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots, extraSlots, lessonTypes, siteSettings } from '@/lib/db/schema';
import { and, inArray, or, eq } from 'drizzle-orm';
import { doTimeRangesOverlap, doesAnyBookingOverlapWithSlot } from '@/lib/utils/time-overlap';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const datesParam = searchParams.get('dates');

    if (!datesParam) {
      return NextResponse.json({ error: 'dates query parameter is required (comma-separated YYYY-MM-DD)' }, { status: 400 });
    }

    const dateStrings = datesParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /\d{4}-\d{2}-\d{2}/.test(s));

    if (dateStrings.length === 0) {
      return NextResponse.json({ error: 'No valid dates provided' }, { status: 400 });
    }

    // Load optional contact phone
    let contactPhone: string | null = null;
    try {
      const settings = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, 'contact_phone'));
      if (settings && settings[0]?.value) contactPhone = String(settings[0].value);
    } catch {}

    // Derive unique days of week from dates
    const daysOfWeek = Array.from(
      new Set(
        dateStrings.map((d) => {
          const dt = new Date(d);
          return dt.getDay();
        })
      )
    );

    // Fetch slot settings for these days
    const allSlotSettings = await db
      .select()
      .from(slotSettings)
      .where(and(inArray(slotSettings.dayOfWeek, daysOfWeek), eq(slotSettings.isActive, true)));

    // Fetch bookings for these dates (exclude cancelled)
    const allBookings = await db
      .select({
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        createdAt: bookings.createdAt,
        lessonTypeName: lessonTypes.name,
      })
      .from(bookings)
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(
        and(
          inArray(bookings.scheduledDate, dateStrings),
          or(
            eq(bookings.status, 'temp'),
            eq(bookings.status, 'on_hold'),
            eq(bookings.status, 'booked'),
            eq(bookings.status, 'confirmed')
          )
        )
      );

    // Fetch blocked and extra slots for these dates
    const allBlocked = await db.select().from(blockedSlots).where(inArray(blockedSlots.date, dateStrings));
    const allExtras = await db.select().from(extraSlots).where(inArray(extraSlots.date, dateStrings));

    // Group data by date
    const slotSettingsByDay: Record<number, any[]> = {};
    for (const s of allSlotSettings) {
      if (!slotSettingsByDay[s.dayOfWeek]) slotSettingsByDay[s.dayOfWeek] = [];
      slotSettingsByDay[s.dayOfWeek].push(s);
    }

    const bookingsByDate: Record<string, any[]> = {};
    for (const b of allBookings) {
      const key = b.scheduledDate instanceof Date
        ? b.scheduledDate.toISOString().split('T')[0]
        : String(b.scheduledDate).slice(0, 10);
      if (!bookingsByDate[key]) bookingsByDate[key] = [];
      bookingsByDate[key].push(b);
    }

    const blockedByDate: Record<string, any[]> = {};
    for (const bl of allBlocked) {
      const key = bl.date as unknown as string;
      if (!blockedByDate[key]) blockedByDate[key] = [];
      blockedByDate[key].push(bl);
    }

    const extrasByDate: Record<string, any[]> = {};
    for (const ex of allExtras) {
      const key = ex.date as unknown as string;
      if (!extrasByDate[key]) extrasByDate[key] = [];
      extrasByDate[key].push(ex);
    }

    // Time window for call-to-book flag (2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const result: Record<string, any[]> = {};

    const normalizeTime = (t: any) => (typeof t === 'string' ? t.slice(0, 5) : String(t).slice(0, 5));
    const hasExactBooking = (
      bookingsForDay: Array<{ startTime: any; endTime: any }>,
      start: any,
      end: any
    ) => {
      const s = normalizeTime(start);
      const e = normalizeTime(end);
      return bookingsForDay.some((b) => normalizeTime(b.startTime) === s && normalizeTime(b.endTime) === e);
    };

    for (const dateStr of dateStrings) {
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay();
      const daySlots = slotSettingsByDay[dayOfWeek] || [];
      const dayBookings = (bookingsByDate[dateStr] || []).filter((b) => {
        const name = (b.lessonTypeName || '').toLowerCase();
        return !name.includes('handledar');
      });
      const dayBlocked = blockedByDate[dateStr] || [];
      const dayExtras = extrasByDate[dateStr] || [];

      const timeSlots: Array<{ time: string; available: boolean; unavailable: boolean; clickable: boolean; gradient: 'green' | 'red'; callForBooking?: boolean; callPhone?: string; isExtraSlot?: boolean; reason?: string }>
        = [];

      for (const slot of daySlots) {
        // Exclude full-day block
        const isAllDayBlocked = dayBlocked.some((b) => b.isAllDay);
        if (isAllDayBlocked) continue;

        // Blocked interval overlap
        const isBlocked = dayBlocked.some((b) => {
          if (!b.timeStart || !b.timeEnd) return false;
          return doTimeRangesOverlap(slot.timeStart, slot.timeEnd, b.timeStart, b.timeEnd);
        });
        if (isBlocked) continue;

        // Booking overlap blocks availability (exclude handledar via dayBookings filtering above)
        const hasBooking = doesAnyBookingOverlapWithSlot(dayBookings, slot.timeStart, slot.timeEnd, false);

        // Within two hours -> call for booking
        const slotDateTime = new Date(`${dateStr}T${slot.timeStart}`);
        const isWithinTwoHours = slotDateTime <= twoHoursFromNow;

        const clickable = !hasBooking && !isWithinTwoHours;
        timeSlots.push({
          time: slot.timeStart,
          available: clickable,
          unavailable: !clickable,
          clickable,
          gradient: clickable ? 'green' : 'red',
          ...(isWithinTwoHours ? { callForBooking: true, callPhone: contactPhone || undefined } : {}),
        });
      }

      // Add extra slots, following same rules
      for (const extra of dayExtras) {
        const hasBooking = doesAnyBookingOverlapWithSlot(dayBookings, extra.timeStart, extra.timeEnd, false);
        const slotDateTime = new Date(`${dateStr}T${extra.timeStart}`);
        const isWithinTwoHours = slotDateTime <= twoHoursFromNow;
        const clickable = !hasBooking && !isWithinTwoHours;
        timeSlots.push({
          time: extra.timeStart,
          available: clickable,
          unavailable: !clickable,
          clickable,
          gradient: clickable ? 'green' : 'red',
          isExtraSlot: true,
          reason: extra.reason || undefined,
          ...(isWithinTwoHours ? { callForBooking: true, callPhone: contactPhone || undefined } : {}),
        });
      }

      // Merge extras with base slots, ensure uniqueness by time and prefer blocked where conflicts
      const merged: Record<string, any> = {};
      for (const s of timeSlots) {
        merged[s.time] = s;
      }
      // Ensure extras are included and override base
      for (const ex of dayExtras) {
        const t = ex.timeStart;
        const hasBooking = doesAnyBookingOverlapWithSlot(dayBookings, ex.timeStart, ex.timeEnd, false);
        const slotDateTime = new Date(`${dateStr}T${ex.timeStart}`);
        const isWithinTwoHours = slotDateTime <= twoHoursFromNow;
        const clickable = !hasBooking && !isWithinTwoHours;
        merged[t] = {
          time: ex.timeStart,
          available: clickable,
          unavailable: !clickable,
          clickable,
          gradient: clickable ? 'green' : 'red',
          isExtraSlot: true,
          reason: ex.reason || undefined,
          ...(isWithinTwoHours ? { callForBooking: true, callPhone: contactPhone || undefined } : {}),
        };
      }
      const mergedArray = Object.values(merged).sort((a: any, b: any) => a.time.localeCompare(b.time));
      result[dateStr] = mergedArray;
    }

    return NextResponse.json({ success: true, slots: result });
  } catch (error) {
    console.error('Error computing visible slots:', error);
    return NextResponse.json({ error: 'Failed to compute slots' }, { status: 500 });
  }
}


