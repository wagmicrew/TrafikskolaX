import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { lessonTypes, bookings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { lessonTypeId, date, time, requestedSpots } = await request.json()

    if (!lessonTypeId || !date || !time || !requestedSpots) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get lesson type details
    const lessonType = await db
      .select()
      .from(lessonTypes)
      .where(eq(lessonTypes.id, lessonTypeId))
      .limit(1)

    if (!lessonType.length) {
      return NextResponse.json(
        { error: 'Lesson type not found' },
        { status: 404 }
      )
    }

    const maxCapacity = lessonType[0].maxStudents || 1

    // Count existing bookings for this date/time/lesson type
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.lessonTypeId, lessonTypeId),
          eq(bookings.date, date),
          eq(bookings.startTime, time),
          eq(bookings.status, 'confirmed')
        )
      )

    // Calculate total spots taken (including supervisors from existing bookings)
    let totalSpotsTaken = 0
    for (const booking of existingBookings) {
      // Each booking takes 1 spot for the student
      totalSpotsTaken += 1
      
      // Add supervisor spots if any
      if (booking.supervisorCount) {
        totalSpotsTaken += booking.supervisorCount
      }
    }

    const availableSpots = maxCapacity - totalSpotsTaken
    const canAccommodate = availableSpots >= requestedSpots

    return NextResponse.json({
      available: canAccommodate,
      availableSpots,
      maxCapacity,
      currentBookings: totalSpotsTaken,
      requestedSpots
    })

  } catch (error) {
    console.error('Capacity check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
