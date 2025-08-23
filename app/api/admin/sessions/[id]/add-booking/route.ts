import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema/sessions';
import { sessionBookings } from '@/lib/db/schema/session-bookings';
import { sessionTypes } from '@/lib/db/schema/session-types';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper function to encrypt personal ID
function encryptPersonalId(personalId: string): string {
  const algorithm = 'aes-256-gcm';
  const key = process.env.PERSONAL_ID_ENCRYPTION_KEY || 'default-key-change-in-production';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(personalId, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { supervisorName, supervisorEmail, supervisorPhone, personalId, supervisorCount, studentId, sendPaymentEmail } = body;

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

    // Create booking
    const newBooking = await db
      .insert(sessionBookings)
      .values({
        sessionId: id,
        studentId: studentId || null,
        supervisorName,
        supervisorEmail,
        supervisorPhone,
        supervisorPersonalNumber: encryptedPersonalId,
        supervisorCount: parseInt(supervisorCount) || 1,
        status: 'pending',
        price,
        basePrice: parseFloat(sessionType.basePrice),
        pricePerSupervisor: sessionType.pricePerSupervisor || 0,
        paymentStatus: 'pending',
        bookedBy: authUser.id,
      })
      .returning();

    // Update session participant count
    await db
      .update(sessions)
      .set({
        currentParticipants: sql`${sessions.currentParticipants} + 1`
      })
      .where(eq(sessions.id, id));

    // Send email if requested
    if (sendPaymentEmail && supervisorEmail) {
      try {
        const { SessionNotificationService } = await import('@/lib/email/session-notifications');

        await SessionNotificationService.sendSessionBookingConfirmation({
          sessionId: id,
          sessionTitle: session.session.title,
          sessionDate: session.session.date,
          sessionStartTime: session.session.startTime,
          sessionEndTime: session.session.endTime,
          sessionType: sessionType.name,
          supervisorName,
          supervisorEmail,
          supervisorPhone,
          price,
          schoolName: 'Din Trafikskola Hässleholm',
          schoolPhone: '0760-389192',
          schoolAddress: 'Östergatan 3a, 281 30 Hässleholm',
        });
      } catch (emailError) {
        console.error('Failed to send payment email:', emailError);
      }
    }

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: newBooking[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
