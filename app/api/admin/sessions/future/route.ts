import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriSessions, teoriLessonTypes } from '@/lib/db/schema/teori';
import { gte, eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    const futureSessions = await db
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
        lessonType: {
          id: teoriLessonTypes.id,
          name: teoriLessonTypes.name,
          description: teoriLessonTypes.description,
          price: teoriLessonTypes.price,
          allowsSupervisors: teoriLessonTypes.allowsSupervisors,
        }
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .where(gte(teoriSessions.date, today))
      .orderBy(teoriSessions.date, teoriSessions.startTime);

    return NextResponse.json({ sessions: futureSessions });
  } catch (error) {
    console.error('Error fetching future sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch future sessions' }, { status: 500 });
  }
}
