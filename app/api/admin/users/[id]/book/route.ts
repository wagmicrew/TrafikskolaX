import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, lessonTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { doTimeRangesOverlap } from '@/lib/utils/time-overlap';

export const dynamic = 'force-dynamic';

// POST - Create a booking for a specific user
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { id: userId } = await params;
    const body = await request.json();
    const {
      lessonTypeId,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      transmissionType,
      totalPrice,
      paymentMethod = 'admin_created',
      paymentStatus = 'paid', // Admin created bookings are typically marked as paid
      status = 'confirmed',
      notes,
    } = body;

    // Validate required fields
    if (!lessonTypeId || !scheduledDate || !startTime || !endTime || !durationMinutes || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify lesson type exists
    const lessonType = await db
      .select()
      .from(lessonTypes)
      .where(eq(lessonTypes.id, lessonTypeId))
      .limit(1);

    if (lessonType.length === 0) {
      return NextResponse.json({ error: 'Lesson type not found' }, { status: 404 });
    }

    // Check for existing bookings that conflict with this timeslot
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.scheduledDate, scheduledDate));

    // Check if there's already a booking for this user at this time
    const userBooking = existingBookings.find(booking => 
      booking.userId === userId && 
      doTimeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );

    if (userBooking) {
      return NextResponse.json({ 
        error: 'This user already has a booking at this time',
        existingBooking: userBooking
      }, { status: 400 });
    }

    // Check for any conflicting bookings (any user) at this time
    const conflictingBooking = existingBookings.find(booking => 
      doTimeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );

    if (conflictingBooking) {
      return NextResponse.json({ 
        error: 'This time slot is already booked by another user',
        conflictingBooking: conflictingBooking
      }, { status: 400 });
    }

    // Create the booking
    const [booking] = await db
      .insert(bookings)
      .values({
        userId: userId,
        lessonTypeId,
        scheduledDate,
        startTime,
        endTime,
        durationMinutes,
        transmissionType,
        totalPrice,
        status,
        paymentStatus,
        paymentMethod,
        notes,
        isGuestBooking: false,
      })
      .returning();

    return NextResponse.json({ 
      booking,
      message: 'Booking created successfully for user'
    });
  } catch (error) {
    console.error('Error creating booking for user:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
