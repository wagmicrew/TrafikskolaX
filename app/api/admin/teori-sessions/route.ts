import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriSessions, teoriLessonTypes } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

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
        }
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .orderBy(desc(teoriSessions.date), desc(teoriSessions.startTime));

    return NextResponse.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Error fetching Teori sessions:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta teorisessioner' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

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

    const newSession = await db.insert(teoriSessions).values({
      lessonTypeId,
      title,
      description,
      date,
      startTime,
      endTime,
      maxParticipants: maxParticipants || 1,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Teorisession skapad',
      session: newSession[0]
    });

  } catch (error) {
    console.error('Error creating Teori session:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa teorisession' },
      { status: 500 }
    );
  }
}
