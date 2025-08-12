import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, bookings, blockedSlots } from '@/lib/db/schema';
import { eq, and, gte, lte, or, sql } from 'drizzle-orm';
import { doesAnyBookingOverlapWithSlot } from '@/lib/utils/time-overlap';

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

    // Cleanup stale temp/on_hold unpaid bookings older than 15 minutes
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const idsResult = await db.execute(sql`
        SELECT id FROM bookings WHERE status = 'cancelled' AND updated_at < ${fifteenMinutesAgo}
      `)
      const ids = (idsResult as any)?.rows?.map((r: any) => r.id) || []
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
      `)
        await db.execute(sql`UPDATE internal_messages SET booking_id = NULL WHERE booking_id = ANY(${ids}::uuid[])`)
        await db.execute(sql`UPDATE payment_history SET booking_id = NULL WHERE booking_id = ANY(${ids}::uuid[])`)
        await db.execute(sql`DELETE FROM booking_plan_items WHERE booking_id = ANY(${ids}::uuid[])`)
        await db.execute(sql`DELETE FROM user_feedback WHERE booking_id = ANY(${ids}::uuid[])`)
        await db.execute(sql`DELETE FROM bookings WHERE id = ANY(${ids}::uuid[])`)
      }
      await db.execute(
        sql`DELETE FROM bookings 
            WHERE (status = 'temp' OR status = 'on_hold') 
              AND (payment_status IS NULL OR payment_status = 'unpaid')
              AND created_at < ${fifteenMinutesAgo}`
      );
      // Also remove cancelled bookings older than 15 minutes
      await db.execute(
        sql`DELETE FROM bookings 
            WHERE status = 'cancelled' 
              AND updated_at < ${fifteenMinutesAgo}`
      );
    } catch {}

    while (current <= end) {
      const date = current.toISOString().split('T')[0];
      const dayOfWeek = current.getUTCDay();

      // Get slot settings for the day
      const daySlots = await db
        .select()
        .from(slotSettings)
        .where(and(eq(slotSettings.dayOfWeek, dayOfWeek), eq(slotSettings.isActive, true)));

      // Get existing bookings for the date (including temporary bookings)
      const existingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.scheduledDate, date),
            or(
              eq(bookings.status, 'on_hold'), 
              eq(bookings.status, 'booked'), 
              eq(bookings.status, 'confirmed'),
              eq(bookings.status, 'temp') // Include temporary bookings to block slots
            )
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

        const hasBooking = doesAnyBookingOverlapWithSlot(
          existingBookings,
          slot.timeStart,
          slot.timeEnd,
          true // exclude expired bookings
        );

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
