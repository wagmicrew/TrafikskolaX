import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriLessonTypes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

    const lessonTypes = await db
      .select()
      .from(teoriLessonTypes)
      .orderBy(desc(teoriLessonTypes.sortOrder), desc(teoriLessonTypes.createdAt));

    return NextResponse.json({
      success: true,
      lessonTypes
    });

  } catch (error) {
    console.error('Error fetching Teori lesson types:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta teorilektionstyper' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const body = await request.json();
    const {
      name,
      description,
      allowsSupervisors,
      // price,
      // pricePerSupervisor,
      // durationMinutes,
      // maxParticipants,
      // isActive,
      sortOrder
    } = body;

    // Validate required fields
    if (!name || description === undefined) {
      return NextResponse.json(
        { error: 'Namn och beskrivning är obligatoriska' },
        { status: 400 }
      );
    }

    const newLessonType = await db.insert(teoriLessonTypes).values({
      name,
      description,
      allowsSupervisors: allowsSupervisors || false,
      // Default price to satisfy NOT NULL constraint, pricing handled per session
      price: '0',
      // Keep type-level extras unset; per-session settings are preferred
      pricePerSupervisor: null,
      durationMinutes: 60,
      maxParticipants: 1,
      isActive: true,
      sortOrder: sortOrder || 0,
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Teorilektionstyp skapad',
      lessonType: newLessonType[0]
    });

  } catch (error) {
    console.error('Error creating Teori lesson type:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa teorilektionstyp' },
      { status: 500 }
    );
  }
}
