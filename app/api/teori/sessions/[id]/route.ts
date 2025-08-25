import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server-auth'
import { db } from '@/lib/db'
import { teoriSessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('admin');

    const data = await request.json();
    const {
      lessonTypeId,
      title,
      description,
      date,
      startTime,
      endTime,
      maxParticipants,
      isActive
    } = data;

    if (!lessonTypeId || !title || !date || !startTime || !endTime || !maxParticipants) {
      return NextResponse.json(
        { error: 'Saknar nödvändiga fält' },
        { status: 400 }
      );
    }

    const [updatedSession] = await db.update(teoriSessions)
      .set({
        lessonTypeId,
        title,
        description,
        date,
        startTime,
        endTime,
        maxParticipants: parseInt(maxParticipants),
        isActive: isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(teoriSessions.id, params.id))
      .returning();

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Sessionen hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error('Error updating Teori session:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera teorisession' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('admin');

    const [deletedSession] = await db.delete(teoriSessions)
      .where(eq(teoriSessions.id, params.id))
      .returning();

    if (!deletedSession) {
      return NextResponse.json(
        { error: 'Sessionen hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: deletedSession
    });

  } catch (error) {
    console.error('Error deleting Teori session:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort teorisession' },
      { status: 500 }
    );
  }
}
