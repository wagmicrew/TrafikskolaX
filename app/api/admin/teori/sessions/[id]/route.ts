import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teoriSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const updatedSession = await db
      .update(teoriSessions)
      .set({
        lessonTypeId: data.lessonTypeId,
        title: data.title,
        description: data.description || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        maxParticipants: data.maxParticipants || 1,
        sessionType: data.sessionType || 'teori',
        price: data.price,
        isActive: data.isActive !== undefined ? data.isActive : true,
        updatedAt: new Date()
      })
      .where(eq(teoriSessions.id, params.id))
      .returning();

    if (updatedSession.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession[0]
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deletedSession = await db
      .delete(teoriSessions)
      .where(eq(teoriSessions.id, params.id))
      .returning();

    if (deletedSession.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
