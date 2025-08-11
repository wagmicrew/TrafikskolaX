import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: sessionId } = await params;

    // Get session details
    const session = await db
      .select({
        id: handledarSessions.id,
        title: handledarSessions.title,
        description: handledarSessions.description,
        date: handledarSessions.date,
        startTime: handledarSessions.startTime,
        endTime: handledarSessions.endTime,
        maxParticipants: handledarSessions.maxParticipants,
        currentParticipants: handledarSessions.currentParticipants,
        pricePerParticipant: handledarSessions.pricePerParticipant,
        teacherId: handledarSessions.teacherId,
        teacherName: users.firstName,
        teacherLastName: users.lastName,
        isActive: handledarSessions.isActive,
        createdAt: handledarSessions.createdAt,
      })
      .from(handledarSessions)
      .leftJoin(users, eq(handledarSessions.teacherId, users.id))
      .where(eq(handledarSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get bookings for this session
    const bookings = await db
      .select({
        id: handledarBookings.id,
        supervisorName: handledarBookings.supervisorName,
        supervisorEmail: handledarBookings.supervisorEmail,
        supervisorPhone: handledarBookings.supervisorPhone,
        price: handledarBookings.price,
        paymentStatus: handledarBookings.paymentStatus,
        paymentMethod: handledarBookings.paymentMethod,
        status: handledarBookings.status,
        reminderSent: handledarBookings.reminderSent,
        createdAt: handledarBookings.createdAt,
        studentName: users.firstName,
        studentLastName: users.lastName,
        studentEmail: users.email,
      })
      .from(handledarBookings)
      .leftJoin(users, eq(handledarBookings.studentId, users.id))
      .where(eq(handledarBookings.sessionId, sessionId));

    const sessionData = {
      ...session[0],
      teacherName: session[0].teacherName && session[0].teacherLastName 
        ? `${session[0].teacherName} ${session[0].teacherLastName}` 
        : 'Ingen lärare tilldelad',
      spotsLeft: session[0].maxParticipants - session[0].currentParticipants,
      bookings: bookings.map(booking => ({
        ...booking,
        studentName: booking.studentName && booking.studentLastName 
          ? `${booking.studentName} ${booking.studentLastName}` 
          : null,
      })),
    };

    return NextResponse.json({ session: sessionData });
  } catch (error) {
    console.error('Error fetching handledar session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { title, description, date, startTime, endTime, maxParticipants, pricePerParticipant, teacherId } = body;

    const updatedSession = await db
      .update(handledarSessions)
      .set({
        title,
        description,
        date,
        startTime,
        endTime,
        maxParticipants: parseInt(maxParticipants),
        pricePerParticipant: parseFloat(pricePerParticipant),
        teacherId: teacherId || null,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, sessionId))
      .returning();

    if (updatedSession.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Session updated successfully', 
      session: updatedSession[0] 
    });
  } catch (error) {
    console.error('Error updating handledar session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: sessionId } = await params;

    // Check if there are any confirmed bookings
    const confirmedBookings = await db
      .select()
      .from(handledarBookings)
      .where(
        and(
          eq(handledarBookings.sessionId, sessionId),
          eq(handledarBookings.paymentStatus, 'paid')
        )
      );

    if (confirmedBookings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete session with confirmed bookings' 
      }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    const deletedSession = await db
      .update(handledarSessions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, sessionId))
      .returning();

    if (deletedSession.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting handledar session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
