import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server-auth'
import { db } from '@/lib/db'
import { teoriLessonTypes } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // For admin requests, show all lesson types (including inactive)
    const searchParams = request.nextUrl.searchParams
    const showAll = searchParams.get('all') === 'true'

    let query = db.select().from(teoriLessonTypes)

    if (!showAll) {
      query = query.where(eq(teoriLessonTypes.isActive, true))
    }

    const lessonTypes = await query.orderBy(desc(teoriLessonTypes.sortOrder), desc(teoriLessonTypes.createdAt))

    return NextResponse.json({ success: true, lessonTypes })
  } catch (error) {
    console.error('Error fetching Teori lesson types:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta teorilektionstyper' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const data = await request.json();
    const {
      name,
      description,
      price,
      priceStudent,
      pricePerSupervisor,
      durationMinutes,
      maxParticipants,
      allowsSupervisors,
      isActive
    } = data;

    if (!name || !price || !priceStudent || !durationMinutes || !maxParticipants) {
      return NextResponse.json(
        { error: 'Saknar nödvändiga fält' },
        { status: 400 }
      );
    }

    // Get the next sort order
    const [maxSort] = await db.select({ sortOrder: teoriLessonTypes.sortOrder })
      .from(teoriLessonTypes)
      .orderBy(desc(teoriLessonTypes.sortOrder))
      .limit(1);

    const nextSortOrder = (maxSort?.sortOrder || 0) + 1;

    const [newLessonType] = await db.insert(teoriLessonTypes).values({
      name,
      description,
      price,
      priceStudent,
      pricePerSupervisor,
      durationMinutes: parseInt(durationMinutes),
      maxParticipants: parseInt(maxParticipants),
      allowsSupervisors: allowsSupervisors ?? false,
      isActive: isActive ?? true,
      sortOrder: nextSortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      lessonType: newLessonType
    });

  } catch (error) {
    console.error('Error creating Teori lesson type:', error);
    return NextResponse.json(
      { error: 'Kunde inte skapa teorilektionstyp' },
      { status: 500 }
    );
  }
}
