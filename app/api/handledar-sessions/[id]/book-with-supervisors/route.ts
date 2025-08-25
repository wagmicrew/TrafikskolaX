import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings, supervisorDetails } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { PersonalDataManager } from '@/lib/utils/personal-data';

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
    const { studentId, supervisors } = body;

    if (!supervisors || !Array.isArray(supervisors) || supervisors.length === 0) {
      return NextResponse.json({ error: 'No supervisors provided' }, { status: 400 });
    }

    // Validate supervisor data
    for (const supervisor of supervisors) {
      if (!supervisor.supervisorName?.trim()) {
        return NextResponse.json({
          error: 'Alla handledare måste ha ett namn'
        }, { status: 400 });
      }

      if (!supervisor.supervisorEmail?.trim()) {
        return NextResponse.json({
          error: 'Alla handledare måste ha en e-postadress'
        }, { status: 400 });
      }

      if (!supervisor.supervisorPhone?.trim()) {
        return NextResponse.json({
          error: 'Alla handledare måste ha ett telefonnummer'
        }, { status: 400 });
      }

      if (!supervisor.supervisorPersonalNumber?.trim()) {
        return NextResponse.json({
          error: 'Alla handledare måste ha ett personnummer'
        }, { status: 400 });
      }

      // Validate personal number format
      if (!PersonalDataManager.validatePersonalNumber(supervisor.supervisorPersonalNumber)) {
        return NextResponse.json({
          error: 'Ogiltigt personnummer format. Använd format: YYYYMMDD-XXXX'
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
    const spotsNeeded = supervisors.length;
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

      // Encrypt and store personal number
      const encryptedPersonalNumber = await PersonalDataManager.encryptPersonalNumber(
        supervisor.supervisorPersonalNumber
      );

      const supervisorDetail = await db.insert(supervisorDetails).values({
        handledarBookingId: bookingId,
        supervisorName: supervisor.supervisorName,
        supervisorEmail: supervisor.supervisorEmail || null,
        supervisorPhone: supervisor.supervisorPhone || null,
        supervisorPersonalNumber: encryptedPersonalNumber, // Store encrypted version
      }).returning();

      supervisorDetailIds.push(supervisorDetail[0].id);
    }

    // Update session participant count
    await db
      .update(handledarSessions)
      .set({
        currentParticipants: (sessionData.currentParticipants ?? 0) + spotsNeeded,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, sessionId));

    // Pricing logic: First handledare is FREE, additional handledare cost extra
    const basePrice = Number(sessionData.pricePerParticipant ?? 0);
    const freeHandledare = 1;
    const additionalHandledare = Math.max(0, supervisors.length - freeHandledare);
    const totalPrice = basePrice + (additionalHandledare * basePrice);

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
