import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema/sessions';
import { sessionTypes } from '@/lib/db/schema/session-types';
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
        id: sessions.id,
        sessionTypeId: sessions.sessionTypeId,
        title: sessions.title,
        description: sessions.description,
        date: sessions.date,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        maxParticipants: sessions.maxParticipants,
        currentParticipants: sessions.currentParticipants,
        teacherId: sessions.teacherId,
        isActive: sessions.isActive,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        sessionType: {
          id: sessionTypes.id,
          name: sessionTypes.name,
          type: sessionTypes.type,
          basePrice: sessionTypes.basePrice,
          pricePerSupervisor: sessionTypes.pricePerSupervisor,
          allowsSupervisors: sessionTypes.allowsSupervisors,
          requiresPersonalId: sessionTypes.requiresPersonalId,
        }
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(eq(sessions.id, id))
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
      .update(sessions)
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
      .where(eq(sessions.id, id))
      .returning();

    if (!updatedSession.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get the complete session with type info
    const sessionWithType = await db
      .select({
        id: sessions.id,
        sessionTypeId: sessions.sessionTypeId,
        title: sessions.title,
        description: sessions.description,
        date: sessions.date,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        maxParticipants: sessions.maxParticipants,
        currentParticipants: sessions.currentParticipants,
        teacherId: sessions.teacherId,
        isActive: sessions.isActive,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        sessionType: {
          id: sessionTypes.id,
          name: sessionTypes.name,
          type: sessionTypes.type,
          basePrice: sessionTypes.basePrice,
          pricePerSupervisor: sessionTypes.pricePerSupervisor,
          allowsSupervisors: sessionTypes.allowsSupervisors,
          requiresPersonalId: sessionTypes.requiresPersonalId,
        }
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(eq(sessions.id, id))
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
      .delete(sessions)
      .where(eq(sessions.id, id))
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
