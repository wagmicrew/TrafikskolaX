import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teoriSessions, teoriLessonTypes } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const sessions = await db
      .select({
        id: teoriSessions.id,
        lessonTypeId: teoriSessions.lessonTypeId,
        title: teoriSessions.title,
        description: teoriSessions.description,
        date: teoriSessions.date,
        startTime: teoriSessions.startTime,
        endTime: teoriSessions.endTime,
        maxParticipants: teoriSessions.maxParticipants,
        currentParticipants: teoriSessions.currentParticipants,
        sessionType: teoriSessions.sessionType,
        price: teoriSessions.price,
        isActive: teoriSessions.isActive,
        lessonTypeName: teoriLessonTypes.name
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .orderBy(desc(teoriSessions.date), teoriSessions.startTime);

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const newSession = await db
      .insert(teoriSessions)
      .values({
        lessonTypeId: data.lessonTypeId,
        title: data.title,
        description: data.description || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        maxParticipants: data.maxParticipants || 1,
        currentParticipants: 0,
        sessionType: data.sessionType || 'teori',
        price: data.price,
        isActive: data.isActive !== undefined ? data.isActive : true
      })
      .returning();

    return NextResponse.json({
      success: true,
      session: newSession[0]
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
