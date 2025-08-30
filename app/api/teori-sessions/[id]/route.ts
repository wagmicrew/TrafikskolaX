import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { teoriLessonTypes, teoriSessions } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    // Fetch session with lesson type details
    const session = await db
      .select({
        id: teoriSessions.id,
        title: teoriSessions.title,
        description: teoriSessions.description,
        date: teoriSessions.date,
        startTime: teoriSessions.startTime,
        endTime: teoriSessions.endTime,
        maxParticipants: teoriSessions.maxParticipants,
        currentParticipants: teoriSessions.currentParticipants,
        isActive: teoriSessions.isActive,
        createdAt: teoriSessions.createdAt,
        updatedAt: teoriSessions.updatedAt,
        lessonTypeId: teoriSessions.lessonTypeId,
        lessonType: {
          id: teoriLessonTypes.id,
          name: teoriLessonTypes.name,
          description: teoriLessonTypes.description,
          allowsSupervisors: teoriLessonTypes.allowsSupervisors,
          price: teoriLessonTypes.price,
          pricePerSupervisor: teoriLessonTypes.pricePerSupervisor,
          durationMinutes: teoriLessonTypes.durationMinutes,
          maxParticipants: teoriLessonTypes.maxParticipants,
        }
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .where(eq(teoriSessions.id, id))
      .limit(1);

    if (!session || session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Format response
    const sessionData = session[0];
    const formattedDateTime = formatDateTime(
      sessionData.date, 
      sessionData.startTime, 
      sessionData.endTime
    );

    return NextResponse.json({
      session: {
        ...sessionData,
        formattedDateTime,
        price: parseFloat(sessionData.lessonType.price || '0'),
        durationMinutes: sessionData.lessonType.durationMinutes || 60,
      }
    });

  } catch (error) {
    console.error('Error fetching Teori session:', error);
    return NextResponse.json({
      error: 'Failed to fetch session details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatDateTime(date: string, startTime: string, endTime: string): string {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `${formattedDate}, ${startTime?.slice(0, 5)} - ${endTime?.slice(0, 5)}`;
}
