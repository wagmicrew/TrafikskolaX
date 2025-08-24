import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sessions, sessionTypes, sessionBookings } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { bookingInvoiceService } from '@/lib/services/booking-invoice-service';
import crypto from 'crypto';

// Encryption function for personal IDs
function encryptPersonalId(personalId: string): string {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || 'fallback-key-32-characters-long'; // Should be 32 characters
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(personalId, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      supervisorName,
      supervisorEmail, 
      supervisorPhone,
      personalId,
      supervisorCount = 1,
      paymentMethod = 'pending',
      guestName,
      guestEmail,
      guestPhone,
      studentId: requestedStudentId,
    } = body;

    let userId: string | null = null;
    let isGuestBooking = true;
    let currentUserId = null;
    let currentUserRole = null;

    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (token) {
      try {
        const payload = await verifyToken(token.value);
        userId = payload.id;
        currentUserId = payload.id;
        currentUserRole = payload.role;
        isGuestBooking = false;
      } catch (error) {
        console.error('Token verification failed:', error);
        // Continue as guest booking
      }
    }

    // Allow admin/teacher to book on behalf of a student
    if (requestedStudentId && (currentUserRole === 'admin' || currentUserRole === 'teacher')) {
      userId = requestedStudentId;
      isGuestBooking = false;
    }

    // Get session and session type info
    const sessionInfo = await db
      .select({
        session: sessions,
        sessionType: sessionTypes
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(eq(sessions.id, id))
      .limit(1);

    if (!sessionInfo.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { session, sessionType } = sessionInfo[0];

    if (!session.isActive) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Check if session is full
    if (session.currentParticipants >= session.maxParticipants) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 });
    }

    // Calculate price
    let price = parseFloat(sessionType.basePrice);
    let supervisorPrice = 0;

    if (sessionType.allowsSupervisors && supervisorCount > 1) {
      const additionalSupervisors = supervisorCount - 1;
      supervisorPrice = additionalSupervisors * (sessionType.pricePerSupervisor || 500);
      price += supervisorPrice;
    }

    // Encrypt personal ID if provided
    let encryptedPersonalId = null;
    if (personalId && sessionType.requiresPersonalId) {
      encryptedPersonalId = encryptPersonalId(personalId);
    }

    // Determine participant details based on session type
    let participantName = '';
    let participantEmail = '';
    let participantPhone = '';

    if (sessionType.requiresPersonalId && supervisorName) {
      // This is a supervisor-required session (like handledarutbildning)
      participantName = supervisorName;
      participantEmail = supervisorEmail || '';
      participantPhone = supervisorPhone || '';
    } else if (isGuestBooking) {
      // Guest booking
      participantName = guestName || '';
      participantEmail = guestEmail || '';
      participantPhone = guestPhone || '';
    } else {
      // Logged-in user booking
      // We should fetch user details, but for now use what's provided
      participantName = guestName || '';
      participantEmail = guestEmail || '';
      participantPhone = guestPhone || '';
    }

    // Validate required fields
    if (!participantName || !participantEmail) {
      return NextResponse.json({ 
        error: 'Namn och e-post krävs för bokning' 
      }, { status: 400 });
    }

    // Create booking
    const newBooking = await db
      .insert(sessionBookings)
      .values({
        sessionId: id,
        studentId: userId,
        supervisorName: participantName,
        supervisorEmail: participantEmail,
        supervisorPhone: participantPhone,
        supervisorPersonalNumber: encryptedPersonalId,
        supervisorCount: sessionType.allowsSupervisors ? supervisorCount : 1,
        totalPrice: price.toString(),
        paymentStatus: paymentMethod === 'credits' ? 'paid' : 'pending',
        paymentMethod: paymentMethod,
        status: paymentMethod === 'credits' ? 'confirmed' : 'pending',
        bookedBy: currentUserId,
        swishUuid: uuidv4(),
      })
      .returning();

    // Update session participant count
    await db
      .update(sessions)
      .set({ 
        currentParticipants: sql`${sessions.currentParticipants} + 1` 
      })
      .where(eq(sessions.id, id));

    // Create invoice unless paid by credits
    let createdInvoice: any = null;
    try {
      if (paymentMethod !== 'credits') {
        createdInvoice = await bookingInvoiceService.createSessionInvoice({
          id: newBooking[0].id,
          studentId: userId || undefined,
          sessionId: id,
          totalPrice: parseFloat(price.toString()),
          status: newBooking[0].status,
          session: { title: session.title, sessionTypeId: session.sessionTypeId }
        }, participantEmail, participantName);
      }
    } catch (e) {
      console.error('Failed to create invoice for session booking:', e);
    }

    // TODO: Send email notification here
    // await sendSessionBookingNotification(participantEmail, newBooking[0], session, sessionType);

    return NextResponse.json({ 
      booking: newBooking[0],
      invoice: createdInvoice,
      message: 'Bokning skapad framgångsrikt',
      sessionInfo: {
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionType: sessionType.name
      }
    });
  } catch (error) {
    console.error('Error creating session booking:', error);
    return NextResponse.json({ 
      error: 'Failed to create booking' 
    }, { status: 500 });
  }
}
