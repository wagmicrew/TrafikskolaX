import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriSessions, teoriLessonTypes } from '@/lib/db/schema/teori';
import { desc, eq, and, gte, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'future';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const today = new Date().toISOString().split('T')[0];

    let query = db
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
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id));

    // Apply scope filter
    if (scope === 'future') {
      query = query.where(gte(teoriSessions.date, today));
    } else if (scope === 'past') {
      query = query.where(lte(teoriSessions.date, today));
    }

    const sessionList = await query
      .orderBy(desc(teoriSessions.date), desc(teoriSessions.startTime))
      .limit(pageSize)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: teoriSessions.id })
      .from(teoriSessions);

    if (scope === 'future') {
      countQuery.where(gte(teoriSessions.date, today));
    } else if (scope === 'past') {
      countQuery.where(lte(teoriSessions.date, today));
    }

    const totalCount = await countQuery;
    const totalPages = Math.ceil(totalCount.length / pageSize);

    return NextResponse.json({
      sessions: sessionList,
      page,
      totalPages,
      total: totalCount.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionTypeId, title, description, date, startTime, endTime, maxParticipants, isActive } = body;

    const newSession = await db
      .insert(teoriSessions)
      .values({
        sessionTypeId,
        title,
        description,
        date,
        startTime,
        endTime,
        maxParticipants: parseInt(maxParticipants) || 1,
        currentParticipants: 0,
        isActive: Boolean(isActive),
      })
      .returning();

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
      .where(eq(teoriSessions.id, newSession[0].id))
      .limit(1);

    return NextResponse.json({
      message: 'Session created successfully',
      session: sessionWithType[0]
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
