import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriSessions, teoriLessonTypes } from '@/lib/db/schema/teori';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const session = await db
      .select({
        id: teoriSessions.id,
        sessionTypeId: teoriSessions.lessonTypeId,
        title: teoriSessions.title,
        description: teoriSessions.description,
        date: teoriSessions.date,
        startTime: teoriSessions.startTime,
        endTime: teoriSessions.endTime,
        maxParticipants: teoriSessions.maxParticipants,
        currentParticipants: teoriSessions.currentParticipants,
        teacherId: teoriSessions.teacherId,
        isActive: teoriSessions.isActive,
        createdAt: teoriSessions.createdAt,
        updatedAt: teoriSessions.updatedAt,
        lessonType: {
          id: teoriLessonTypes.id,
          name: teoriLessonTypes.name,
          description: teoriLessonTypes.description,
          price: teoriLessonTypes.price,
          pricePerSupervisor: teoriLessonTypes.pricePerSupervisor,
          allowsSupervisors: teoriLessonTypes.allowsSupervisors,
          durationMinutes: teoriLessonTypes.durationMinutes,
        }
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .where(eq(teoriSessions.id, id))
      .limit(1);

    if (!session.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: session[0] });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { sessionTypeId, title, description, date, startTime, endTime, maxParticipants, isActive } = body;

    const updatedSession = await db
      .update(teoriSessions)
      .set({
        sessionTypeId,
        title,
        description,
        date,
        startTime,
        endTime,
        maxParticipants: parseInt(maxParticipants) || 1,
        isActive: Boolean(isActive),
      })
      .where(eq(teoriSessions.id, id))
      .returning();

    if (!updatedSession.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get the complete session with type info
    const sessionWithType = await db
      .select({
        id: teoriSessions.id,
        sessionTypeId: teoriSessions.lessonTypeId,
        title: teoriSessions.title,
        description: teoriSessions.description,
        date: teoriSessions.date,
        startTime: teoriSessions.startTime,
        endTime: teoriSessions.endTime,
        maxParticipants: teoriSessions.maxParticipants,
        currentParticipants: teoriSessions.currentParticipants,
        teacherId: teoriSessions.teacherId,
        isActive: teoriSessions.isActive,
        createdAt: teoriSessions.createdAt,
        updatedAt: teoriSessions.updatedAt,
        lessonType: {
          id: teoriLessonTypes.id,
          name: teoriLessonTypes.name,
          description: teoriLessonTypes.description,
          price: teoriLessonTypes.price,
          pricePerSupervisor: teoriLessonTypes.pricePerSupervisor,
          allowsSupervisors: teoriLessonTypes.allowsSupervisors,
          durationMinutes: teoriLessonTypes.durationMinutes,
        }
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .where(eq(teoriSessions.id, id))
      .limit(1);

    return NextResponse.json({
      message: 'Session updated successfully',
      session: sessionWithType[0]
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deletedSession = await db
      .delete(teoriSessions)
      .where(eq(teoriSessions.id, id))
      .returning();

    if (!deletedSession.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Session deleted successfully',
      session: deletedSession[0]
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
