import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/server-auth'
import { db } from '@/lib/db'
import { teoriLessonTypes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const [updatedLessonType] = await db.update(teoriLessonTypes)
      .set({
        name,
        description,
        price,
        priceStudent,
        pricePerSupervisor,
        durationMinutes: parseInt(durationMinutes),
        maxParticipants: parseInt(maxParticipants),
        allowsSupervisors: allowsSupervisors ?? false,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(teoriLessonTypes.id, params.id))
      .returning();

    if (!updatedLessonType) {
      return NextResponse.json(
        { error: 'Lektionstypen hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lessonType: updatedLessonType
    });

  } catch (error) {
    console.error('Error updating Teori lesson type:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera teorilektionstyp' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('admin');

    const [deletedLessonType] = await db.delete(teoriLessonTypes)
      .where(eq(teoriLessonTypes.id, params.id))
      .returning();

    if (!deletedLessonType) {
      return NextResponse.json(
        { error: 'Lektionstypen hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lessonType: deletedLessonType
    });

  } catch (error) {
    console.error('Error deleting Teori lesson type:', error);
    return NextResponse.json(
      { error: 'Kunde inte ta bort teorilektionstyp' },
      { status: 500 }
    );
  }
}
