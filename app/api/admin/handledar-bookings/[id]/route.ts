import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarBookings, handledarSessions, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';

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
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: bookingId } = await params;
    const body = await request.json().catch(() => ({}));
    const confirmPaidRemoval = Boolean(body?.confirmPaidRemoval);

    // Get booking details first
    const booking = await db
      .select({
        id: handledarBookings.id,
        sessionId: handledarBookings.sessionId,
        supervisorName: handledarBookings.supervisorName,
        supervisorEmail: handledarBookings.supervisorEmail,
        paymentStatus: handledarBookings.paymentStatus,
      })
      .from(handledarBookings)
      .where(eq(handledarBookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];

    // For paid bookings, require explicit confirmation flag
    if (bookingData.paymentStatus === 'paid' && !confirmPaidRemoval) {
      return NextResponse.json({ 
        error: 'Bokningen är betald. Bekräfta att du har gjort återbetalning (confirmPaidRemoval=true) för att avboka.' 
      }, { status: 400 });
    }

    // Fetch session details for email
    const [session] = await db
      .select({ id: handledarSessions.id, title: handledarSessions.title, date: handledarSessions.date, startTime: handledarSessions.startTime, endTime: handledarSessions.endTime })
      .from(handledarSessions)
      .where(eq(handledarSessions.id, bookingData.sessionId))
      .limit(1);

    // Send cancellation email using trigger system
    if (bookingData.supervisorEmail) {
      try {
        const dateStr = session?.date ? new Date(session.date as any).toLocaleDateString('sv-SE') : '';
        await EnhancedEmailService.sendTriggeredEmail('handledar_booking_cancelled', {
          user: undefined,
          booking: {
            id: String(bookingData.id),
            scheduledDate: dateStr,
            startTime: String(session?.startTime||'').slice(0,5),
            endTime: String(session?.endTime||'').slice(0,5),
            lessonTypeName: session?.title || 'Handledarutbildning',
            totalPrice: ''
          },
          customData: {
            supervisorEmail: bookingData.supervisorEmail,
            supervisorName: bookingData.supervisorName || ''
          }
        });
      } catch (e) {
        console.error('Failed to send handledar cancellation email', e);
      }
    }

    // Delete the booking
    await db.delete(handledarBookings).where(eq(handledarBookings.id, bookingId));

    // Update session participant count
    await db
      .update(handledarSessions)
      .set({
        currentParticipants: sql`current_participants - 1`,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, bookingData.sessionId));

    return NextResponse.json({ message: 'Booking removed successfully' });
  } catch (error) {
    console.error('Error removing handledar booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

  const { id: bookingId } = await params;
  const body = await request.json();
  const { action } = body;

    if (action === 'remind') {
      // Update reminder status
      const updatedBooking = await db
        .update(handledarBookings)
        .set({
          reminderSent: true,
          updatedAt: new Date(),
        })
        .where(eq(handledarBookings.id, bookingId))
        .returning();

      if (updatedBooking.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Here you would typically send an email/SMS reminder
      // For now, we'll just mark it as sent
      
      return NextResponse.json({ 
        message: 'Reminder sent successfully',
        booking: updatedBooking[0]
      });
    }

    if (action === 'move') {
      const { targetSessionId } = body as { targetSessionId?: string };
      if (!targetSessionId) {
        return NextResponse.json({ error: 'targetSessionId is required' }, { status: 400 });
      }

      // Load booking and sessions
      const [b] = await db
        .select({ id: handledarBookings.id, sessionId: handledarBookings.sessionId, paymentStatus: handledarBookings.paymentStatus, supervisorEmail: handledarBookings.supervisorEmail, supervisorName: handledarBookings.supervisorName })
        .from(handledarBookings)
        .where(eq(handledarBookings.id, bookingId))
        .limit(1);
      if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      const [currentSession] = await db
        .select({ id: handledarSessions.id, title: handledarSessions.title, date: handledarSessions.date, startTime: handledarSessions.startTime, endTime: handledarSessions.endTime, max: handledarSessions.maxParticipants, current: handledarSessions.currentParticipants })
        .from(handledarSessions)
        .where(eq(handledarSessions.id, (b as any).sessionId))
        .limit(1);
      const [targetSession] = await db
        .select({ id: handledarSessions.id, title: handledarSessions.title, date: handledarSessions.date, startTime: handledarSessions.startTime, endTime: handledarSessions.endTime, max: handledarSessions.maxParticipants, current: handledarSessions.currentParticipants })
        .from(handledarSessions)
        .where(eq(handledarSessions.id, targetSessionId))
        .limit(1);

      if (!targetSession) return NextResponse.json({ error: 'Target session not found' }, { status: 404 });

      // Ensure target is in the future
      if (targetSession.date && new Date(targetSession.date as any) < new Date()) {
        return NextResponse.json({ error: 'Cannot move to a past session' }, { status: 400 });
      }

      // Optional capacity check (if using currentParticipants)
      if (typeof targetSession.max === 'number' && typeof targetSession.current === 'number' && targetSession.current >= targetSession.max) {
        return NextResponse.json({ error: 'Target session is full' }, { status: 400 });
      }

      // Perform move
      await db
        .update(handledarBookings)
        .set({ sessionId: targetSessionId as any, updatedAt: new Date() })
        .where(eq(handledarBookings.id, bookingId));

      // Update counters if you maintain them
      if (currentSession?.id) {
        await db
          .update(handledarSessions)
          .set({ currentParticipants: sql`current_participants - 1`, updatedAt: new Date() })
          .where(eq(handledarSessions.id, currentSession.id));
      }
      await db
        .update(handledarSessions)
        .set({ currentParticipants: sql`current_participants + 1`, updatedAt: new Date() })
        .where(eq(handledarSessions.id, targetSession.id));

      // Send move email using trigger system
      if ((b as any).supervisorEmail) {
        try {
          const dateStr = targetSession?.date ? new Date(targetSession.date as any).toLocaleDateString('sv-SE') : '';
          await EnhancedEmailService.sendTriggeredEmail('handledar_booking_moved', {
            booking: {
              id: String(bookingId),
              scheduledDate: dateStr,
              startTime: String(targetSession?.startTime||'').slice(0,5),
              endTime: String(targetSession?.endTime||'').slice(0,5),
              lessonTypeName: targetSession?.title || 'Handledarutbildning',
              totalPrice: ''
            },
            customData: {
              supervisorEmail: (b as any).supervisorEmail,
              supervisorName: (b as any).supervisorName || ''
            }
          });
        } catch (e) { 
          console.error('Failed to send handledar move email', e); 
        }
      }

      return NextResponse.json({ message: 'Booking moved successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing handledar booking action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
