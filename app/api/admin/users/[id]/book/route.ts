import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, lessonTypes, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

// POST - Create a booking for a specific user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
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
      teacherId, // Optional teacher assignment
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

    // Get student information
    const student = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentInfo = student[0];
    const adminUser = authResult.user;

    // Create the booking
    const [booking] = await db
      .insert(bookings)
      .values({
        userId: params.id, // Student ID
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
        teacherId: teacherId || null, // Assign teacher if provided
        // Store booking creator information in notes
        notes: notes ? `${notes}\n\nBokad av: ${adminUser.firstName} ${adminUser.lastName} (Admin)` : `Bokad av: ${adminUser.firstName} ${adminUser.lastName} (Admin)`,
      })
      .returning();

    return NextResponse.json({ 
      booking,
      message: 'Booking created successfully for student',
      studentInfo: {
        name: `${studentInfo.firstName} ${studentInfo.lastName}`,
        email: studentInfo.email,
        phone: studentInfo.phone,
      },
      bookedBy: `${adminUser.firstName} ${adminUser.lastName} (Admin)`
    });
  } catch (error) {
    console.error('Error creating booking for user:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
