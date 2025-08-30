import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessonTypes, slotSettings, blockedSlots, extraSlots, bookings, teoriSessions } from '@/lib/db/schema';
import { eq, and, gte, lte, or, isNull, sql } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { normalizeDateKey } from '@/lib/utils/date';
import { doesAnyBookingOverlapWithSlot, doTimeRangesOverlap } from '@/lib/utils/time-overlap';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const lessonTypeId = searchParams.get('lessonTypeId');

    if (!date || !lessonTypeId) {
      return NextResponse.json({ error: 'Date and lessonTypeId are required' }, { status: 400 });
    }

    // Get lesson type info
    const [lessonType] = await db
      .select()
      .from(lessonTypes)
      .where(eq(lessonTypes.id, lessonTypeId));

    if (!lessonType) {
      return NextResponse.json({ error: 'Lesson type not found' }, { status: 404 });
    }

    // Get slot settings for the day of week
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const slotsForDay = await db
      .select()
      .from(slotSettings)
      .where(and(
        eq(slotSettings.dayOfWeek, dayOfWeek),
        eq(slotSettings.isActive, true)
      ));

    // Get blocked slots for this date
    const blockedForDate = await db
      .select()
      .from(blockedSlots)
      .where(eq(blockedSlots.date, date));

    // Get extra slots for this date
    const extrasForDate = await db
      .select()
      .from(extraSlots)
      .where(eq(extraSlots.date, date));

    // Get existing bookings for this date and lesson type
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(and(
        eq(bookings.scheduledDate, date),
        eq(bookings.lessonTypeId, lessonTypeId)
      ));

    // Generate available slots
    const availableSlots = [];

    // Check regular slots
    for (const slot of slotsForDay) {
      const slotTime = slot.timeStart.slice(0, 5); // HH:MM format
      const slotEndTime = slot.timeEnd.slice(0, 5);

      // Check if slot is blocked
      const isBlocked = blockedForDate.some(block =>
        block.timeStart && block.timeEnd &&
        doTimeRangesOverlap(slotTime, slotEndTime, block.timeStart, block.timeEnd)
      );

      if (isBlocked) {
        availableSlots.push({
          date,
          time: slotTime,
          available: false,
          status: 'blocked'
        });
        continue;
      }

      // Check if slot is already booked
      const isBooked = doesAnyBookingOverlapWithSlot(
        existingBookings,
        slotTime,
        slotEndTime,
        false
      );

      if (isBooked) {
        availableSlots.push({
          date,
          time: slotTime,
          available: false,
          status: 'booked'
        });
        continue;
      }

      // Check if extra slot exists for this time
      const hasExtraSlot = extrasForDate.some(extra =>
        extra.timeStart.slice(0, 5) === slotTime &&
        extra.timeEnd.slice(0, 5) === slotEndTime
      );

      availableSlots.push({
        date,
        time: slotTime,
        available: true,
        status: hasExtraSlot ? 'extra' : 'available'
      });
    }

    // Add extra slots that aren't already included
    for (const extra of extrasForDate) {
      const extraTime = extra.timeStart.slice(0, 5);
      const extraEndTime = extra.timeEnd.slice(0, 5);

      // Check if already included
      const alreadyIncluded = availableSlots.some(slot => slot.time === extraTime);

      if (!alreadyIncluded) {
        // Check if extra slot is blocked
        const isBlocked = blockedForDate.some(block =>
          block.timeStart && block.timeEnd &&
          doTimeRangesOverlap(extraTime, extraEndTime, block.timeStart, block.timeEnd)
        );

        if (!isBlocked) {
          availableSlots.push({
            date,
            time: extraTime,
            available: true,
            status: 'extra'
          });
        }
      }
    }

    return NextResponse.json({
      slots: availableSlots,
      lessonType: {
        id: lessonType.id,
        name: lessonType.name,
        durationMinutes: lessonType.durationMinutes,
        price: lessonType.price,
        priceStudent: lessonType.priceStudent
      }
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
