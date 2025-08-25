import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sessionBookings } from '@/lib/db/schema/session-bookings';
import { sessions } from '@/lib/db/schema/sessions';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, targetSessionId } = body;

    if (action === 'move' && targetSessionId) {
      // Move booking to different session
      const booking = await db
        .select()
        .from(sessionBookings)
        .where(eq(sessionBookings.id, id))
        .limit(1);

      if (!booking.length) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Check if target session exists and has space
      const targetSession = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, targetSessionId))
        .limit(1);

      if (!targetSession.length) {
        return NextResponse.json({ error: 'Target session not found' }, { status: 404 });
      }

      if (targetSession[0].currentParticipants >= targetSession[0].maxParticipants) {
        return NextResponse.json({ error: 'Target session is full' }, { status: 400 });
      }

      // Update booking
      await db
        .update(sessionBookings)
        .set({ sessionId: targetSessionId })
        .where(eq(sessionBookings.id, id));

      // Update participant counts
      await db
        .update(sessions)
        .set({
          currentParticipants: sql`${sessions.currentParticipants} - 1`
        })
        .where(eq(sessions.id, booking[0].sessionId));

      await db
        .update(sessions)
        .set({
          currentParticipants: sql`${sessions.currentParticipants} + 1`
        })
        .where(eq(sessions.id, targetSessionId));

      return NextResponse.json({ message: 'Booking moved successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const booking = await db
      .select()
      .from(sessionBookings)
      .where(eq(sessionBookings.id, id))
      .limit(1);

    if (!booking.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Delete booking
    await db
      .delete(sessionBookings)
      .where(eq(sessionBookings.id, id));

    // Update session participant count
    await db
      .update(sessions)
      .set({
        currentParticipants: sql`${sessions.currentParticipants} - 1`
      })
      .where(eq(sessions.id, booking[0].sessionId));

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
