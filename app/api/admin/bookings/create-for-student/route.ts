import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes, handledarSessions, handledarBookings, userCredits } from '@/lib/db/schema';
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
      // Handledar-specific optional fields
      sessionId, // specific handledar session ID when lessonType is handledar
      supervisorName,
      supervisorEmail,
      supervisorPhone,
      useHandledarCredit = false,
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

    // Handledar special ID handling
    const isHandledarGroup = lessonTypeId === 'handledarutbildning-group';
    let lessonType: any[] = [];
    let isHandledar = false;
    if (!isHandledarGroup) {
      // Verify lesson type exists
      lessonType = await db
        .select()
        .from(lessonTypes)
        .where(eq(lessonTypes.id, lessonTypeId))
        .limit(1);

      if (lessonType.length === 0) {
        return NextResponse.json({ error: 'Lesson type not found' }, { status: 404 });
      }
      isHandledar = (lessonType[0]?.name || '').toLowerCase().includes('handledar');
    } else {
      isHandledar = true;
    }

    // Handledar branch
    if (isHandledar) {
      if (!sessionId || sessionId === 'handledarutbildning-group') {
        return NextResponse.json({ error: 'Välj en specifik handledarutbildning', requireSessionSelection: true }, { status: 400 });
      }

      // Fetch session
      const sessionRows = await db
        .select()
        .from(handledarSessions)
        .where(and(eq(handledarSessions.id, sessionId), eq(handledarSessions.isActive, true)))
        .limit(1);

      if (!sessionRows.length) {
        return NextResponse.json({ error: 'Session hittades inte' }, { status: 404 });
      }
      const session = sessionRows[0];

      // Require supervisor details
      if (!supervisorName || (!supervisorEmail && !supervisorPhone)) {
        return NextResponse.json({ error: 'Handledarinformation krävs (namn och email eller telefon)' }, { status: 400 });
      }

      // If credits requested, deduct one handledar credit
      if (useHandledarCredit) {
        const creditRows = await db
          .select()
          .from(userCredits)
          .where(and(eq(userCredits.userId, studentId), eq(userCredits.creditType, 'handledar')));

        const firstWithCredits = creditRows.find(c => (c.creditsRemaining || 0) > 0);
        if (!firstWithCredits) {
          return NextResponse.json({ error: 'Inga handledarkrediter tillgängliga' }, { status: 400 });
        }

        await db.update(userCredits)
          .set({ creditsRemaining: firstWithCredits.creditsRemaining - 1, updatedAt: new Date() })
          .where(eq(userCredits.id, firstWithCredits.id));
      }

      // Increment participant count
      await db
        .update(handledarSessions)
        .set({ currentParticipants: sql`${handledarSessions.currentParticipants} + 1` })
        .where(eq(handledarSessions.id, sessionId));

      // Create handledar booking
      const [hBooking] = await db
        .insert(handledarBookings)
        .values({
          sessionId,
          studentId,
          supervisorName,
          supervisorEmail: supervisorEmail || null,
          supervisorPhone: supervisorPhone || null,
          price: totalPrice,
          paymentStatus: useHandledarCredit || paymentStatus === 'paid' ? 'paid' : 'pending',
          paymentMethod: useHandledarCredit ? 'credits' : paymentMethod,
          status: useHandledarCredit || paymentStatus === 'paid' ? 'confirmed' : 'pending',
          bookedBy: authResult.user?.id || studentId,
          swishUUID: uuidv4(),
        })
        .returning();

      // Send emails: supervisor + student via template engine
      try {
        const { EmailService } = await import('@/lib/email/email-service');
        const context = {
          user: { id: student[0].id, email: student[0].email, firstName: student[0].firstName, lastName: student[0].lastName, role: student[0].role },
          booking: {
            id: hBooking.id,
            scheduledDate: String(session.date),
            startTime: String(session.startTime),
            endTime: String(session.endTime),
            lessonTypeName: 'Handledarutbildning',
            totalPrice: String(totalPrice),
          },
          customData: {
            supervisorName,
            supervisorEmail: supervisorEmail || '',
            supervisorPhone: supervisorPhone || ''
          }
        } as any;
        // Ensure template exists/receivers set in admin; this call will use configured receivers
        await EmailService.sendTriggeredEmail('handledar_booking_confirmed' as any, context);
      } catch (e) {
        console.error('Failed to send handledar emails', e);
      }

      return NextResponse.json({ booking: hBooking, message: 'Handledarutbildning bokad' });
    }

    // Regular lesson branch
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