import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings, supervisorDetails } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    const sessionId = params.id;
    const body = await request.json();
    const { studentId, supervisors } = body;

    if (!supervisors || !Array.isArray(supervisors) || supervisors.length === 0) {
      return NextResponse.json({ error: 'No supervisors provided' }, { status: 400 });
    }

    // Validate supervisor data
    for (const supervisor of supervisors) {
      if (!supervisor.supervisorName || (!supervisor.supervisorEmail && !supervisor.supervisorPhone)) {
        return NextResponse.json({ 
          error: 'Each supervisor must have a name and either email or phone' 
        }, { status: 400 });
      }
    }

    let bookedBy = null;
    if (token) {
      const user = await verifyToken(token);
      bookedBy = user?.userId || user?.id;
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
    const spotsNeeded = supervisors.length;
    const spotsAvailable = sessionData.maxParticipants - sessionData.currentParticipants;

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
    const supervisorDetailIds = [];

    // Create bookings for each supervisor
    for (const supervisor of supervisors) {
      // Create the main booking
      const booking = await db.insert(handledarBookings).values({
        sessionId: sessionId,
        studentId: studentId || null,
        supervisorName: supervisor.supervisorName,
        supervisorEmail: supervisor.supervisorEmail || null,
        supervisorPhone: supervisor.supervisorPhone || null,
        price: sessionData.pricePerParticipant,
        paymentStatus: 'pending',
        status: 'pending',
        bookedBy: bookedBy,
        reminderSent: false,
      }).returning();

      const bookingId = booking[0].id;
      bookingIds.push(bookingId);

      // If personal number is provided, encrypt and store it
      if (supervisor.supervisorPersonalNumber) {
        const saltRounds = 12;
        const hashedPersonalNumber = await bcrypt.hash(supervisor.supervisorPersonalNumber, saltRounds);
        
        const supervisorDetail = await db.insert(supervisorDetails).values({
          handledarBookingId: bookingId,
          supervisorName: supervisor.supervisorName,
          supervisorEmail: supervisor.supervisorEmail || null,
          supervisorPhone: supervisor.supervisorPhone || null,
          supervisorPersonalNumber: hashedPersonalNumber, // Store encrypted version
        }).returning();

        supervisorDetailIds.push(supervisorDetail[0].id);
      }
    }

    // Update session participant count
    await db
      .update(handledarSessions)
      .set({
        currentParticipants: sessionData.currentParticipants + spotsNeeded,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, sessionId));

    const totalPrice = sessionData.pricePerParticipant * spotsNeeded;

    return NextResponse.json({
      message: 'Booking successful',
      bookingIds,
      supervisorDetailIds,
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
    console.error('Error creating handledar booking with supervisors:', error);
    return NextResponse.json({ 
      error: 'Failed to create booking' 
    }, { status: 500 });
  }
}
