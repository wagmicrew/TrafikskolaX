import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teoriLessonTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const updatedLessonType = await db
      .update(teoriLessonTypes)
      .set({
        name: data.name,
        description: data.description || null,
        allowsSupervisors: data.allowsSupervisors || false,
        price: data.price,
        pricePerSupervisor: data.pricePerSupervisor || null,
        durationMinutes: data.durationMinutes || 60,
        maxParticipants: data.maxParticipants || 1,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
        updatedAt: new Date()
      })
      .where(eq(teoriLessonTypes.id, params.id))
      .returning();

    if (updatedLessonType.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lesson type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lessonType: updatedLessonType[0]
    });
  } catch (error) {
    console.error('Error updating lesson type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deletedLessonType = await db
      .delete(teoriLessonTypes)
      .where(eq(teoriLessonTypes.id, params.id))
      .returning();

    if (deletedLessonType.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lesson type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson type' },
      { status: 500 }
    );
  }
}
