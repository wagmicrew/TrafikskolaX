import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    const body = await request.json();
    const { participants } = body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: 'No participants provided' }, { status: 400 });
    }

    // Validate participant data
    for (const participant of participants) {
      if (!participant.supervisorName || (!participant.supervisorEmail && !participant.supervisorPhone)) {
        return NextResponse.json({ 
          error: 'Each participant must have a name and either email or phone' 
        }, { status: 400 });
      }
    }

    let bookedBy = null;
    if (token) {
      const user = await verifyToken(token);
      bookedBy = user?.userId;
    }

    // Get session details
    const session = await db
      .select()
      .from(handledarSessions)
      .where(
        and(
          eq(handledarSessions.id, sessionId),
          eq(handledarSessions.isActive, true)
        )
      )
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found or not available' }, { status: 404 });
    }

    const sessionData = session[0];

    // Check if session has enough spots
    const spotsNeeded = participants.length;
    const spotsAvailable = (sessionData.maxParticipants ?? 0) - (sessionData.currentParticipants ?? 0);

    if (spotsNeeded > spotsAvailable) {
      return NextResponse.json({ 
        error: `Not enough spots available. Requested: ${spotsNeeded}, Available: ${spotsAvailable}` 
      }, { status: 400 });
    }

    // Check if session is in the future
    const sessionDateTime = new Date(`${sessionData.date}T${sessionData.startTime}`);
    const now = new Date();
    
    if (sessionDateTime <= now) {
      return NextResponse.json({ 
        error: 'Cannot book sessions that have already started' 
      }, { status: 400 });
    }

    const bookingIds = [];

    // Create bookings for each participant
    for (const participant of participants) {
      const booking = await db.insert(handledarBookings).values({
        sessionId: sessionId,
        studentId: null, // Will be linked later if user logs in
        supervisorName: participant.supervisorName,
        supervisorEmail: participant.supervisorEmail || null,
        supervisorPhone: participant.supervisorPhone || null,
        price: sessionData.pricePerParticipant,
        paymentStatus: 'pending',
        status: 'pending',
        bookedBy: bookedBy,
        reminderSent: false,
      }).returning();

      bookingIds.push(booking[0].id);
    }

    // Update session participant count
    await db
      .update(handledarSessions)
      .set({
        currentParticipants: (sessionData.currentParticipants ?? 0) + spotsNeeded,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, sessionId));

    const totalPrice = Number(sessionData.pricePerParticipant ?? 0) * spotsNeeded;

    return NextResponse.json({
      message: 'Booking successful',
      bookingIds,
      totalPrice,
      sessionInfo: {
        title: sessionData.title,
        date: sessionData.date,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
      },
      paymentRequired: true,
    });

  } catch (error) {
    console.error('Error creating handledar booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
