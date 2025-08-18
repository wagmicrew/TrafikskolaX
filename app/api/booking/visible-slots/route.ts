import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots, extraSlots, lessonTypes, siteSettings } from '@/lib/db/schema';
import { and, inArray, or, eq, sql } from 'drizzle-orm';
import { doTimeRangesOverlap, doesAnyBookingOverlapWithSlot } from '@/lib/utils/time-overlap';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { normalizeDateKey } from '@/lib/utils/date';
import { qliroService } from '@/lib/payment/qliro-service';

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
    // Identify current user (to filter reserved extra slots)
    let currentUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token');
      if (token) {
        const payload = await verifyToken(token.value);
        if (payload && (payload as any).userId) currentUserId = (payload as any).userId as string;
      }
    } catch {}


    if (dateStrings.length === 0) {
      return NextResponse.json({ error: 'No valid dates provided' }, { status: 400 });
    }

    // Pre-slot cleanup to keep availability correct
    try {
      // 1) Invalidate stale Qliro orders (>24h pending)
      const expiredCount = await qliroService.invalidateStaleOrders();
      console.log(`[SLOTS][CLEANUP] Invalidated stale Qliro orders: ${expiredCount}`);

      // 2) Expire Qliro orders tied to bookings in the past (safety net)
      await db.execute(sql`
        UPDATE qliro_orders qo
        SET status = 'expired', updated_at = NOW()
        FROM bookings b
        WHERE qo.booking_id = b.id
          AND (qo.status = 'created' OR qo.status = 'pending')
          AND b.scheduled_date < CURRENT_DATE
      `);

      // 3) Remove temp/on_hold unpaid bookings for past dates so they don't block slots
      await db.execute(sql`
        DELETE FROM bookings 
        WHERE (status = 'temp' OR status = 'on_hold')
          AND (payment_status IS NULL OR payment_status = 'unpaid')
          AND scheduled_date < CURRENT_DATE
      `);
    } catch (cleanupErr) {
      console.warn('[SLOTS][CLEANUP] Skipping cleanup due to error:', cleanupErr);
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
    console.log(`\n=== BOOKING QUERY DEBUG ===`);
    console.log(`Querying bookings for dates:`, dateStrings);
    
    const allBookings = await db
      .select({
        id: bookings.id,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        createdAt: bookings.createdAt,
        lessonTypeName: lessonTypes.name,
        paymentStatus: bookings.paymentStatus,
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

    console.log(`Found ${allBookings.length} total bookings from database:`);
    allBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ID: ${booking.id}, Date: ${booking.scheduledDate} (${typeof booking.scheduledDate}), Time: ${booking.startTime}, Status: ${booking.status}`);
    });

    // Fetch blocked and extra slots for these dates
    const allBlocked = await db.select().from(blockedSlots).where(inArray(blockedSlots.date, dateStrings));
    const allExtras = await db.select().from(extraSlots).where(inArray(extraSlots.date, dateStrings));

    // Use shared normalizeDateKey from '@/lib/utils/date'

    // Group data by date
    const slotSettingsByDay: Record<number, any[]> = {};
    for (const s of allSlotSettings) {
      if (!slotSettingsByDay[s.dayOfWeek]) slotSettingsByDay[s.dayOfWeek] = [];
      slotSettingsByDay[s.dayOfWeek].push(s);
    }

    const bookingsByDate: Record<string, any[]> = {};
    console.log(`\n=== DATE NORMALIZATION DEBUG ===`);
    for (const b of allBookings) {
      const key = normalizeDateKey(b.scheduledDate);
      console.log(`Booking ${b.id}: scheduledDate="${b.scheduledDate}" -> normalized key="${key}"`);
      if (key && !bookingsByDate[key]) bookingsByDate[key] = [];
      if (key) bookingsByDate[key].push(b);
    }
    
    console.log(`\n=== BOOKINGS GROUPED BY DATE ===`);
    Object.keys(bookingsByDate).forEach(date => {
      console.log(`Date ${date}: ${bookingsByDate[date].length} bookings`);
      bookingsByDate[date].forEach(booking => {
        console.log(`  - ${booking.startTime} (${booking.status}) - ${booking.lessonTypeName}`);
      });
    });

    const blockedByDate: Record<string, any[]> = {};
    for (const bl of allBlocked) {
      const key = normalizeDateKey(bl.date);
      if (key && !blockedByDate[key]) blockedByDate[key] = [];
      if (key) blockedByDate[key].push(bl);
    }

    const extrasByDate: Record<string, any[]> = {};
    for (const ex of allExtras) {
      const key = normalizeDateKey(ex.date);
      if (key && !extrasByDate[key]) extrasByDate[key] = [];
      if (key) extrasByDate[key].push(ex);
    }

    // Time window for call-to-book flag (2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    console.log(`\n=== TIME WINDOW DEBUG ===`);
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Two hours from now: ${twoHoursFromNow.toISOString()}`);

    const result: Record<string, any[]> = {};

    // Cleanup stale temp/on_hold unpaid bookings older than 15 minutes
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      // Archive stale cancelled bookings into bookings_old for traceability, then remove
      const idsResult = await db.execute(sql`
        SELECT id FROM bookings WHERE status = 'cancelled' AND updated_at < ${fifteenMinutesAgo}
      `);
      const ids = (idsResult as any)?.rows?.map((r: any) => r.id) || [];
      if (ids.length > 0) {
        await db.execute(sql`
        INSERT INTO bookings_old (
          id, student_id, teacher_id, car_id, invoice_id,
          booking_date, duration, lesson_type, price, payment_status,
          notes, is_completed, is_cancelled, cancel_reason,
          created_at, updated_at
        )
        SELECT b.id, b.user_id, b.teacher_id, b.car_id, b.invoice_number,
               (b.scheduled_date::timestamp + b.start_time), b.duration_minutes,
               (CASE
                  WHEN lower(coalesce(lt.name, 'b')) LIKE '%b%' THEN 'b_license'
                  WHEN lower(coalesce(lt.name, '')) LIKE '%a%' THEN 'a_license'
                  WHEN lower(coalesce(lt.name, '')) LIKE '%taxi%' THEN 'taxi_license'
                  WHEN lower(coalesce(lt.name, '')) LIKE '%theory%' THEN 'theory'
                  ELSE 'assessment'
                END)::lesson_type,
               b.total_price::numeric,
               (CASE
                  WHEN b.payment_status = 'paid' THEN 'paid'
                  WHEN b.payment_status = 'failed' THEN 'failed'
                  WHEN b.payment_status = 'refunded' THEN 'refunded'
                  ELSE 'pending'
                END)::payment_status,
               b.notes,
               coalesce(b.is_completed, false),
               true,
               'auto-archived (stale cancelled)',
               b.created_at, b.updated_at
        FROM bookings b
        LEFT JOIN lesson_types lt ON lt.id = b.lesson_type_id
        WHERE b.id = ANY(${ids}::uuid[])
        ON CONFLICT (id) DO NOTHING
      `);
        await db.execute(sql`UPDATE internal_messages SET booking_id = NULL WHERE booking_id = ANY(${ids}::uuid[])`);
        await db.execute(sql`UPDATE payment_history SET booking_id = NULL WHERE booking_id = ANY(${ids}::uuid[])`);
        await db.execute(sql`DELETE FROM booking_plan_items WHERE booking_id = ANY(${ids}::uuid[])`);
        await db.execute(sql`DELETE FROM user_feedback WHERE booking_id = ANY(${ids}::uuid[])`);
        await db.execute(sql`DELETE FROM bookings WHERE id = ANY(${ids}::uuid[])`);
      }
      await db.execute(
        sql`DELETE FROM bookings 
            WHERE (status = 'temp' OR status = 'on_hold') 
              AND (payment_status IS NULL OR payment_status = 'unpaid')
              AND created_at < ${fifteenMinutesAgo}`
      );
      // Also remove cancelled bookings as stale so they never block slots
      await db.execute(
        sql`DELETE FROM bookings 
            WHERE status = 'cancelled' 
              AND updated_at < ${fifteenMinutesAgo}`
      );
    } catch {}

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
      console.log(`\n=== PROCESSING DATE: ${dateStr} ===`);
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay();
      const daySlots = slotSettingsByDay[dayOfWeek] || [];
      const dayBookings = (bookingsByDate[dateStr] || []).filter((b) => {
        const name = (b.lessonTypeName || '').toLowerCase();
        return !name.includes('handledar');
      });
      const dayBlocked = blockedByDate[dateStr] || [];
      const dayExtras = extrasByDate[dateStr] || [];

      console.log(`Day of week: ${dayOfWeek}, Available slot settings: ${daySlots.length}`);
      console.log(`Bookings for ${dateStr}:`, dayBookings.map(b => ({
        scheduledDate: b.scheduledDate,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        paymentStatus: b.paymentStatus,
        lessonType: b.lessonTypeName
      })));
      console.log(`Blocked slots: ${dayBlocked.length}, Extra slots: ${dayExtras.length}`);

      // If the whole day is blocked, skip returning any slots for this date
      const isDayAllBlocked = dayBlocked.some((b) => b.isAllDay);
      if (isDayAllBlocked) {
        result[dateStr] = [];
        continue;
      }

      const timeSlots: Array<{ time: string; available: boolean; unavailable: boolean; clickable: boolean; gradient: 'green' | 'red' | 'orange'; callForBooking?: boolean; callPhone?: string; isExtraSlot?: boolean; reason?: string; hasStaleBooking?: boolean; statusText?: string }>
        = [];

      for (const slot of daySlots) {
        console.log(`\n--- Processing slot: ${slot.timeStart} - ${slot.timeEnd} ---`);
        
        // Exclude full-day block
        const isAllDayBlocked = dayBlocked.some((b) => b.isAllDay);
        if (isAllDayBlocked) {
          console.log(`Slot ${slot.timeStart} skipped - day is all blocked`);
          continue;
        }

        // Blocked interval overlap
        const isBlocked = dayBlocked.some((b) => {
          if (!b.timeStart || !b.timeEnd) return false;
          return doTimeRangesOverlap(slot.timeStart, slot.timeEnd, b.timeStart, b.timeEnd);
        });
        if (isBlocked) {
          console.log(`Slot ${slot.timeStart} skipped - blocked by interval`);
          continue;
        }

        // Simple exact match check - slot either exists in bookings or it doesn't
        const normalizeTime = (t: any) => typeof t === 'string' ? t.slice(0, 5) : String(t).slice(0, 5);
        const slotTimeNorm = normalizeTime(slot.timeStart);
        
        console.log(`Looking for bookings at exact time: ${slotTimeNorm}`);
        const exactBookings = dayBookings.filter(booking => {
          const bookingStartNorm = normalizeTime(booking.startTime);
          console.log(`  Comparing slot ${slotTimeNorm} with booking ${bookingStartNorm} (${booking.status})`);
          return bookingStartNorm === slotTimeNorm;
        });
        const hasBooking = exactBookings.length > 0;
        console.log(`Slot ${slotTimeNorm} has ${exactBookings.length} exact bookings:`, exactBookings.map(b => ({
          startTime: b.startTime,
          status: b.status,
          paymentStatus: b.paymentStatus
        })));
        
        // Check if there's a stale temporary booking
        const hasStaleTemp = exactBookings.some(booking => {
          const isTemp = booking.status === 'temp' || booking.status === 'on_hold';
          const isUnpaid = !booking.paymentStatus || booking.paymentStatus === 'unpaid';
          const createdAt = new Date(booking.createdAt);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          return isTemp && isUnpaid && createdAt < fiveMinutesAgo;
        });

        // Within two hours -> call for booking (construct local Date from components)
        const [yy1, mm1, dd1] = dateStr.split('-').map(Number);
        const [hh1, mi1] = normalizeTime(slot.timeStart).split(':').map(Number);
        const slotDateTime = new Date(yy1, (mm1 || 1) - 1, dd1 || 1, hh1 || 0, mi1 || 0, 0, 0);
        const isWithinTwoHours = slotDateTime.getTime() <= twoHoursFromNow.getTime();
        console.log(`  Time check: slot ${dateStr} ${normalizeTime(slot.timeStart)} -> ${slotDateTime.toString()}, within 2h: ${isWithinTwoHours}`);

        // Color logic based on booking status
        let slotStatus = 'available';
        let gradient: 'green' | 'orange' | 'red' = 'green'; // Default to green (available)
        let clickable = true; // Default to clickable
        let statusText = '';

        if (hasBooking) {
          // Booking exists in database
          clickable = false;
          const booking = exactBookings[0];
          
          if (booking.status === 'temp' || booking.status === 'on_hold') {
            // Temporary, on-hold, or stale booking - ORANGE
            slotStatus = hasStaleTemp ? 'stale' : 'temporary';
            gradient = 'orange';
            statusText = 'Tillfälligt bokad';
            console.log(`  → ORANGE: Temp/on-hold booking (${booking.status})`);
          } else {
            // Confirmed/booked status - RED
            slotStatus = 'booked';
            gradient = 'red';
            statusText = 'Bokad';
            console.log(`  → RED: Confirmed booking (${booking.status})`);
          }
        } else if (isWithinTwoHours) {
          // No booking but within two hours - RED (call required)
          slotStatus = 'call_required';
          gradient = 'red';
          clickable = false;
          statusText = 'Ring för bokning';
          console.log(`  → RED: Within 2 hours, call required`);
        } else {
          // No booking and not within two hours - GREEN (available)
          slotStatus = 'available';
          gradient = 'green';
          clickable = true;
          statusText = 'Tillgänglig';
          console.log(`  → GREEN: Available for booking`);
        }

        console.log(`Final slot status: ${gradient} (${statusText}), clickable: ${clickable}`);

        timeSlots.push({
          time: slot.timeStart,
          available: slotStatus === 'available',
          unavailable: slotStatus !== 'available',
          clickable,
          gradient,
          hasStaleBooking: hasStaleTemp,
          callForBooking: slotStatus === 'call_required',
          callPhone: slotStatus === 'call_required' ? contactPhone || undefined : undefined,
          statusText,
        });
      }

      // Add extra slots, following same rules
      for (const extra of dayExtras) {
        // If reserved for a specific user, only include when it matches
        if (extra.reservedForUserId && extra.reservedForUserId !== currentUserId) continue;
        // Skip extras that overlap a blocked interval
        const extraBlocked = dayBlocked.some((b) => {
          if (!b.timeStart || !b.timeEnd) return false;
          return doTimeRangesOverlap(extra.timeStart, extra.timeEnd, b.timeStart, b.timeEnd);
        });
        if (extraBlocked) continue;

        const hasBooking = doesAnyBookingOverlapWithSlot(dayBookings, extra.timeStart, extra.timeEnd, false);
        const [yy2, mm2, dd2] = dateStr.split('-').map(Number);
        const [hh2, mi2] = normalizeTime(extra.timeStart).split(':').map(Number);
        const slotDateTime = new Date(yy2, (mm2 || 1) - 1, dd2 || 1, hh2 || 0, mi2 || 0, 0, 0);
        const isWithinTwoHours = slotDateTime.getTime() <= twoHoursFromNow.getTime();
        const clickable = !hasBooking && !isWithinTwoHours;
        if (clickable) {
          timeSlots.push({
            time: extra.timeStart,
            available: true,
            unavailable: false,
            clickable: true,
            gradient: 'green',
            isExtraSlot: true,
            reason: extra.reason || undefined,
          });
        } else if (isWithinTwoHours && !hasBooking) {
          timeSlots.push({
            time: extra.timeStart,
            available: false,
            unavailable: true,
            clickable: false,
            gradient: 'red',
            isExtraSlot: true,
            reason: extra.reason || undefined,
            callForBooking: true,
            callPhone: contactPhone || undefined,
          });
        }
      }

      // Merge extras with base slots, ensure uniqueness by time and prefer blocked where conflicts
      const merged: Record<string, any> = {};
      for (const s of timeSlots) {
        merged[s.time] = s;
      }
      // Ensure extras are included and override base
      for (const ex of dayExtras) {
        if (ex.reservedForUserId && ex.reservedForUserId !== currentUserId) continue;
        const t = ex.timeStart;
        const extraBlocked = dayBlocked.some((b) => {
          if (!b.timeStart || !b.timeEnd) return false;
          return doTimeRangesOverlap(ex.timeStart, ex.timeEnd, b.timeStart, b.timeEnd);
        });
        if (extraBlocked) continue;
        const hasBooking = doesAnyBookingOverlapWithSlot(dayBookings, ex.timeStart, ex.timeEnd, false);
        const [yy3, mm3, dd3] = dateStr.split('-').map(Number);
        const [hh3, mi3] = normalizeTime(ex.timeStart).split(':').map(Number);
        const slotDateTime = new Date(yy3, (mm3 || 1) - 1, dd3 || 1, hh3 || 0, mi3 || 0, 0, 0);
        const isWithinTwoHours = slotDateTime.getTime() <= twoHoursFromNow.getTime();
        const clickable = !hasBooking && !isWithinTwoHours;
        if (clickable) {
          merged[t] = {
            time: ex.timeStart,
            available: true,
            unavailable: false,
            clickable: true,
            gradient: 'green',
            isExtraSlot: true,
            reason: ex.reason || undefined,
          };
        } else if (isWithinTwoHours && !hasBooking) {
          merged[t] = {
            time: ex.timeStart,
            available: false,
            unavailable: true,
            clickable: false,
            gradient: 'red',
            isExtraSlot: true,
            reason: ex.reason || undefined,
            callForBooking: true,
            callPhone: contactPhone || undefined,
          };
        }
      }
      const mergedArray = Object.values(merged).sort((a: any, b: any) => a.time.localeCompare(b.time));
      result[dateStr] = mergedArray;
      
      console.log(`\n=== FINAL RESULT FOR ${dateStr} ===`);
      console.log(`Total slots: ${mergedArray.length}`);
      console.log('Slot summary:', mergedArray.map((s: any) => `${s.time}: ${s.gradient} (${s.statusText})`));
    }

    console.log('\n=== API RESPONSE ===');
    console.log('Final result keys:', Object.keys(result));
    return NextResponse.json({ success: true, slots: result });
  } catch (error) {
    console.error('Error computing visible slots:', error);
    return NextResponse.json({ error: 'Failed to compute slots' }, { status: 500 });
  }
}


