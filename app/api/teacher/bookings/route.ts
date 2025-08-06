import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, and, gte, lte, asc, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const teacherId = searchParams.get('teacherId');
    const upcoming = searchParams.get('upcoming');

    // Build the base query
    const baseQuery = {
      id: bookings.id,
      userId: bookings.userId,
      userName: users.firstName,
      userLastName: users.lastName,
      userPhone: users.phone,
      userEmail: users.email,
      lessonTypeId: bookings.lessonTypeId,
      lessonTypeName: lessonTypes.name,
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      totalPrice: bookings.totalPrice,
      isCompleted: bookings.isCompleted,
      durationMinutes: bookings.durationMinutes,
      transmissionType: bookings.transmissionType,
      teacherId: bookings.teacherId,
      createdAt: bookings.createdAt,
      // Guest booking information
      isGuestBooking: bookings.isGuestBooking,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      // Student information (for guest bookings, use guest info; for regular bookings, use user info)
      studentName: sql<string>`CASE 
        WHEN ${bookings.isGuestBooking} = true THEN ${bookings.guestName}
        ELSE CONCAT(${users.firstName}, ' ', ${users.lastName})
      END`.as('studentName'),
      studentPhone: sql<string>`CASE 
        WHEN ${bookings.isGuestBooking} = true THEN ${bookings.guestPhone}
        ELSE ${users.phone}
      END`.as('studentPhone'),
      studentEmail: sql<string>`CASE 
        WHEN ${bookings.isGuestBooking} = true THEN ${bookings.guestEmail}
        ELSE ${users.email}
      END`.as('studentEmail'),
      // Booking creator information (for guest bookings, show who created it)
      bookedBy: sql<string>`CASE 
        WHEN ${bookings.isGuestBooking} = true THEN 'Gästbokning'
        ELSE 'Studentbokning'
      END`.as('bookedBy'),
    };

    const currentTeacherId = teacherId || user.userId;
    let whereConditions = [eq(bookings.teacherId, currentTeacherId)];

    // Add date filter if specified
    if (date) {
      whereConditions.push(eq(bookings.scheduledDate, date));
    }

    // Add upcoming filter if specified
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      whereConditions.push(gte(bookings.scheduledDate, today));
    }

    const results = await db
      .select(baseQuery)
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(and(...whereConditions))
      .orderBy(upcoming === 'true' ? asc(bookings.scheduledDate) : asc(bookings.startTime), asc(bookings.startTime));

    // Format the results for the frontend
    const formattedBookings = results.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      userName: booking.userId ? `${booking.userName || ''} ${booking.userLastName || ''}`.trim() || 'Okänd användare' : 'Gästbokning',
      userPhone: booking.userPhone,
      userEmail: booking.userEmail,
      lessonTypeId: booking.lessonTypeId,
      lessonTypeName: booking.lessonTypeName || 'Okänd lektionstyp',
      scheduledDate: booking.scheduledDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      isCompleted: booking.isCompleted,
      durationMinutes: booking.durationMinutes,
      transmissionType: booking.transmissionType,
      teacherId: booking.teacherId,
      createdAt: booking.createdAt,
      // Student information
      studentName: booking.studentName || 'Okänd elev',
      studentPhone: booking.studentPhone,
      studentEmail: booking.studentEmail,
      // Booking creator information
      bookedBy: booking.bookedBy || 'Okänd',
      isGuestBooking: booking.isGuestBooking,
    }));

    return NextResponse.json({ 
      bookings: formattedBookings,
      total: formattedBookings.length 
    });
  } catch (error) {
    console.error('Error fetching teacher bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new booking (teacher planning)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      lessonTypeId,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      transmissionType = 'manual',
      totalPrice,
      notes,
      studentName, // Optional student name for guest booking
      studentEmail, // Optional student email for guest booking
      studentPhone, // Optional student phone for guest booking
      studentId, // Optional student ID for existing user
    } = body;

    // Validate required fields
    if (!lessonTypeId || !scheduledDate || !startTime || !endTime || !durationMinutes) {
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

    // Calculate total price if not provided
    const lessonPrice = parseFloat(lessonType[0].price.toString());
    const duration = Number(durationMinutes);
    const calculatedPrice = totalPrice || (lessonPrice / 60) * duration;

    // Determine if this is a guest booking or for an existing student
    const isGuestBooking = !!(studentName || studentEmail || studentPhone);
    
    // For guest bookings, we don't have a userId, so we'll use null
    // For existing students, we use the provided studentId
    const bookingUserId = isGuestBooking ? null : studentId;

    // Create the booking
    const [booking] = await db
      .insert(bookings)
      .values({
        userId: bookingUserId, // Student taking the lesson (null for guest bookings)
        lessonTypeId,
        scheduledDate,
        startTime,
        endTime,
        durationMinutes,
        transmissionType,
        totalPrice: calculatedPrice,
        status: 'confirmed', // Teacher created bookings are confirmed
        paymentStatus: 'paid', // Teacher created bookings are marked as paid
        paymentMethod: 'teacher_created',
        notes: notes ? `${notes}\n\nBokad av: ${user.firstName} ${user.lastName} (Lärare)` : `Bokad av: ${user.firstName} ${user.lastName} (Lärare)`,
        isGuestBooking,
        guestName: studentName,
        guestEmail: studentEmail,
        guestPhone: studentPhone,
        teacherId: user.userId, // Assign to the teacher who created it
      })
      .returning();

    return NextResponse.json({ 
      booking,
      message: 'Booking created successfully',
      teacherInfo: {
        name: `${user.firstName} ${user.lastName}`,
        id: user.userId,
      }
    });
  } catch (error) {
    console.error('Error creating teacher booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
