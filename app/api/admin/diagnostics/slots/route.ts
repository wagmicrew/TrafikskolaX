import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bookings, blockedSlots, extraSlots, slotSettings, lessonTypes } from '@/lib/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { doesAnyBookingOverlapWithSlot, doTimeRangesOverlap } from '@/lib/utils/time-overlap'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const datesParam = searchParams.get('dates')
    if (!datesParam) {
      return NextResponse.json({ error: 'dates is required (comma-separated YYYY-MM-DD)' }, { status: 400 })
    }

    const dates = datesParam.split(',').map(s => s.trim()).filter(Boolean)
    if (dates.length === 0) {
      return NextResponse.json({ error: 'no valid dates' }, { status: 400 })
    }

    // Load data
    const [allSlots, allBlocked, allExtras, allBookings] = await Promise.all([
      db.select().from(slotSettings),
      db.select().from(blockedSlots).where(inArray(blockedSlots.date, dates)),
      db.select().from(extraSlots).where(inArray(extraSlots.date, dates)),
      db
        .select({
          id: bookings.id,
          scheduledDate: bookings.scheduledDate,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          status: bookings.status,
          paymentStatus: bookings.paymentStatus,
          createdAt: bookings.createdAt,
          lessonTypeName: lessonTypes.name,
        })
        .from(bookings)
        .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
        .where(inArray(bookings.scheduledDate, dates)),
    ])

    const slotsByDow: Record<number, any[]> = {}
    for (const s of allSlots) {
      if (!slotsByDow[s.dayOfWeek]) slotsByDow[s.dayOfWeek] = []
      slotsByDow[s.dayOfWeek].push(s)
    }

    const blockedByDate: Record<string, any[]> = {}
    for (const b of allBlocked) {
      const k = b.date instanceof Date ? b.date.toISOString().split('T')[0] : String(b.date)
      if (!blockedByDate[k]) blockedByDate[k] = []
      blockedByDate[k].push(b)
    }

    const extrasByDate: Record<string, any[]> = {}
    for (const e of allExtras) {
      const k = e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date)
      if (!extrasByDate[k]) extrasByDate[k] = []
      extrasByDate[k].push(e)
    }

    const bookingsByDate: Record<string, any[]> = {}
    for (const b of allBookings) {
      const k = b.scheduledDate instanceof Date ? b.scheduledDate.toISOString().split('T')[0] : String(b.scheduledDate)
      if (!bookingsByDate[k]) bookingsByDate[k] = []
      bookingsByDate[k].push(b)
    }

    const diagnostics: Record<string, any> = {}
    for (const dateStr of dates) {
      const dayOfWeek = new Date(dateStr).getDay()
      const baseSlots = (slotsByDow[dayOfWeek] || []).map(s => ({ timeStart: s.timeStart, timeEnd: s.timeEnd }))
      const blocked = blockedByDate[dateStr] || []
      const extras = extrasByDate[dateStr] || []
      const dayBookings = (bookingsByDate[dateStr] || []).filter(b => !String(b.lessonTypeName || '').toLowerCase().includes('handledar'))

      const isAllDayBlocked = blocked.some(b => b.isAllDay)
      const pruned: Array<{ time: string; reason: string }> = []
      const available: string[] = []

      if (!isAllDayBlocked) {
        for (const s of baseSlots) {
          const overlapped = blocked.some(b => b.timeStart && b.timeEnd && doTimeRangesOverlap(s.timeStart, s.timeEnd, b.timeStart, b.timeEnd))
          if (overlapped) {
            pruned.push({ time: s.timeStart, reason: 'blocked_interval' })
            continue
          }
          const hasBooking = doesAnyBookingOverlapWithSlot(dayBookings as any, s.timeStart, s.timeEnd, true)
          if (hasBooking) {
            pruned.push({ time: s.timeStart, reason: 'booking_overlap' })
            continue
          }
          available.push(s.timeStart)
        }
        for (const ex of extras) {
          const overlapped = blocked.some(b => b.timeStart && b.timeEnd && doTimeRangesOverlap(ex.timeStart, ex.timeEnd, b.timeStart, b.timeEnd))
          if (overlapped) {
            pruned.push({ time: ex.timeStart, reason: 'blocked_interval(extra)' })
            continue
          }
          const hasBooking = doesAnyBookingOverlapWithSlot(dayBookings as any, ex.timeStart, ex.timeEnd, true)
          if (!hasBooking && !available.includes(ex.timeStart)) available.push(ex.timeStart)
        }
      }

      diagnostics[dateStr] = {
        isAllDayBlocked,
        blocked,
        extras,
        baseSlots,
        dayBookings,
        pruned,
        available,
      }
    }

    return NextResponse.json({ success: true, diagnostics })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate diagnostics' }, { status: 500 })
  }
}


