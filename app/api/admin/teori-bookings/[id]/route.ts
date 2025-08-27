import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriBookings, teoriSessions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthAPI();
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { id: bookingId } = await params;

  try {
    // Get booking details including sessionId
    const [booking] = await db
      .select({
        id: teoriBookings.id,
        sessionId: teoriBookings.sessionId,
        supervisorName: teoriBookings.supervisorName
      })
      .from(teoriBookings)
      .where(eq(teoriBookings.id, bookingId));

    if (!booking) {
      return NextResponse.json({ error: 'Bokning hittades inte' }, { status: 404 });
    }

    // Delete the booking
    const [deleted] = await db
      .delete(teoriBookings)
      .where(eq(teoriBookings.id, bookingId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Kunde inte radera bokning' }, { status: 500 });
    }

    // Decrease participant counter
    await db
      .update(teoriSessions)
      .set({
        currentParticipants: sql`${teoriSessions.currentParticipants} - 1`,
        updatedAt: new Date()
      })
      .where(eq(teoriSessions.id, booking.sessionId));

    return NextResponse.json({
      success: true,
      message: 'Deltagare borttagen!',
      booking: deleted
    });

  } catch (error) {
    console.error('Error removing teori participant:', error);
    return NextResponse.json({ error: 'Kunde inte ta bort deltagare' }, { status: 500 });
  }
}
