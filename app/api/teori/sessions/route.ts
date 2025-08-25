import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server-auth'
import { db } from '@/lib/db'
import { teoriSessions, teoriLessonTypes } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lessonTypeId = searchParams.get('lessonTypeId')
    const available = searchParams.get('available') === 'true'

    const conditions = [eq(teoriSessions.isActive, true)] as any[]
    if (lessonTypeId) conditions.push(eq(teoriSessions.lessonTypeId, lessonTypeId))
    if (available) conditions.push(sql`${teoriSessions.date} >= CURRENT_DATE`)

    const sessions = await db
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
        lessonType: {
          id: teoriLessonTypes.id,
          name: teoriLessonTypes.name,
          allowsSupervisors: teoriLessonTypes.allowsSupervisors,
          price: teoriLessonTypes.price,
          pricePerSupervisor: teoriLessonTypes.pricePerSupervisor,
          durationMinutes: teoriLessonTypes.durationMinutes,
        },
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .where(and(...conditions))
      .orderBy(desc(teoriSessions.date), desc(teoriSessions.startTime))

    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    console.error('Error fetching public Teori sessions:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta teorisessioner' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const [newSession] = await db.insert(teoriSessions).values({
      lessonTypeId,
      title,
      description,
      date,
      startTime,
      endTime,
      maxParticipants: parseInt(maxParticipants),
      currentParticipants: 0,
      isActive: isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      session: newSession
    });

  } catch (error) {
    console.error('Error creating Teori session:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa teorisession' },
      { status: 500 }
    );
  }
}
