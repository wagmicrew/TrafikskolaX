import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { doTimeRangesOverlap } from '@/lib/utils/time-overlap';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const {
      studentId, // The student to book for
      lessonTypeId,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      transmissionType,
      totalPrice,
      paymentMethod = 'admin_created',
      paymentStatus = 'paid',
      status = 'confirmed',
      notes,
    } = body;

    // Validate required fields
    if (!studentId || !lessonTypeId || !scheduledDate || !startTime || !endTime || !durationMinutes || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify student exists
    const student = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
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

    // Check if there's already a booking for this student at this time
    const studentBooking = existingBookings.find(booking => 
      booking.userId === studentId && 
      doTimeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );

    if (studentBooking) {
      return NextResponse.json({ 
        error: 'This student already has a booking at this time',
        existingBooking: studentBooking
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
        userId: studentId, // This is the key - set userId to the selected student
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
        swishUUID: uuidv4(),
        teacherId: authResult.user?.id, // Set the teacher/admin who created the booking
      })
      .returning();

    // Send email notification to the student
    await sendStudentNotification(student[0], booking, lessonType[0]);

    return NextResponse.json({ 
      booking,
      message: 'Booking created successfully for student'
    });
  } catch (error) {
    console.error('Error creating booking for student:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

async function sendStudentNotification(student: any, booking: any, lessonType: any) {
  try {
    // Use the email template service
    const { EmailService } = await import('@/lib/email/email-service');
    
    const emailContext = {
      user: {
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        role: student.role
      },
      booking: {
        id: booking.id,
        scheduledDate: format(new Date(booking.scheduledDate), 'yyyy-MM-dd'),
        startTime: booking.startTime,
        endTime: booking.endTime,
        lessonTypeName: lessonType?.name || 'Unknown',
        totalPrice: booking.totalPrice?.toString() || '0',
        swishUUID: booking.swishUUID,
        paymentMethod: booking.paymentMethod
      },
      customData: {
        swishNumber: process.env.NEXT_PUBLIC_SWISH_NUMBER || '1234567890'
      }
    };

    // Send confirmation email to the student
    await EmailService.sendTriggeredEmail('payment_confirmed', emailContext);
    await EmailService.sendTriggeredEmail('booking_confirmed', emailContext);

    console.log(`Email sent to student ${student.email} for booking ${booking.id}`);
  } catch (error) {
    console.error('Failed to send email to student:', error);
  }
} 