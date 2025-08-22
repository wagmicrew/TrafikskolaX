import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriSessions, teoriBookings } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');

    const { id } = params;
    const body = await request.json();
    const {
      lessonTypeId,
      title,
      description,
      date,
      startTime,
      endTime,
      maxParticipants,
      isActive
    } = body;

    // Validate required fields
    if (!lessonTypeId || !title || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    const updatedSession = await db
      .update(teoriSessions)
      .set({
        lessonTypeId,
        title,
        description,
        date,
        startTime,
        endTime,
        maxParticipants: maxParticipants || 1,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(teoriSessions.id, id))
      .returning();

    if (updatedSession.length === 0) {
      return NextResponse.json(
        { error: 'Teorisession hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teorisession uppdaterad',
      session: updatedSession[0]
    });

  } catch (error) {
    console.error('Error updating Teori session:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera teorisession' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');

    const { id } = params;

    // Check if there are any bookings for this session
    const bookingsCount = await db
      .select({ count: count() })
      .from(teoriBookings)
      .where(eq(teoriBookings.sessionId, id));

    if (bookingsCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Kan inte ta bort teorisession som har bokningar' },
        { status: 400 }
      );
    }

    const deletedSession = await db
      .delete(teoriSessions)
      .where(eq(teoriSessions.id, id))
      .returning();

    if (deletedSession.length === 0) {
      return NextResponse.json(
        { error: 'Teorisession hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teorisession raderad',
      session: deletedSession[0]
    });

  } catch (error) {
    console.error('Error deleting Teori session:', error);
    return NextResponse.json(
      { error: 'Kunde inte radera teorisession' },
      { status: 500 }
    );
  }
}
