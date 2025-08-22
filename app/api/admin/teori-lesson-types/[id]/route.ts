import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriLessonTypes, teoriSessions } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');

    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      allowsSupervisors,
      price,
      pricePerSupervisor,
      durationMinutes,
      maxParticipants,
      isActive,
      sortOrder
    } = body;

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Namn och pris är obligatoriska' },
        { status: 400 }
      );
    }

    const updatedLessonType = await db
      .update(teoriLessonTypes)
      .set({
        name,
        description,
        allowsSupervisors: allowsSupervisors || false,
        price: price.toString(),
        pricePerSupervisor: pricePerSupervisor ? pricePerSupervisor.toString() : null,
        durationMinutes: durationMinutes || 60,
        maxParticipants: maxParticipants || 1,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        updatedAt: new Date(),
      })
      .where(eq(teoriLessonTypes.id, id))
      .returning();

    if (updatedLessonType.length === 0) {
      return NextResponse.json(
        { error: 'Teorilektionstyp hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teorilektionstyp uppdaterad',
      lessonType: updatedLessonType[0]
    });

  } catch (error) {
    console.error('Error updating Teori lesson type:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera teorilektionstyp' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');

    const { id } = params;

    // Check if there are any sessions using this lesson type
    const sessionsCount = await db
      .select({ count: count() })
      .from(teoriSessions)
      .where(eq(teoriSessions.lessonTypeId, id));

    if (sessionsCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Kan inte ta bort teorilektionstyp som används av sessioner' },
        { status: 400 }
      );
    }

    const deletedLessonType = await db
      .delete(teoriLessonTypes)
      .where(eq(teoriLessonTypes.id, id))
      .returning();

    if (deletedLessonType.length === 0) {
      return NextResponse.json(
        { error: 'Teorilektionstyp hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teorilektionstyp raderad',
      lessonType: deletedLessonType[0]
    });

  } catch (error) {
    console.error('Error deleting Teori lesson type:', error);
    return NextResponse.json(
      { error: 'Kunde inte radera teorilektionstyp' },
      { status: 500 }
    );
  }
}
