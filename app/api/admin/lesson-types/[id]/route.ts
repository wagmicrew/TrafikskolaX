import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessonTypes, bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

// GET - Get single lesson type
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await params;
    const lessonType = await db
      .select()
      .from(lessonTypes)
      .where(eq(lessonTypes.id, id))
      .limit(1);

    if (!lessonType.length) {
      return NextResponse.json({ error: 'Lesson type not found' }, { status: 404 });
    }

    return NextResponse.json({ lessonType: lessonType[0] });
  } catch (error) {
    console.error('Error fetching lesson type:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson type' }, { status: 500 });
  }
}

// PUT - Update lesson type
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await params;
    
    const body = await request.json();
    const {
      name,
      description,
      durationMinutes,
      price,
      priceStudent,
      salePrice,
      isActive
    } = body;

    const updateData = {
      name,
      description,
      durationMinutes,
      price,
      priceStudent,
      salePrice,
      isActive,
      updatedAt: new Date(),
    };

    const updatedLessonType = await db
      .update(lessonTypes)
      .set(updateData)
      .where(eq(lessonTypes.id, id))
      .returning();

    if (!updatedLessonType.length) {
      return NextResponse.json({ error: 'Lesson type not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Lesson type updated successfully',
      lessonType: updatedLessonType[0] 
    });
  } catch (error) {
    console.error('Error updating lesson type:', error);
    return NextResponse.json({ error: 'Failed to update lesson type' }, { status: 500 });
  }
}

// DELETE - Delete lesson type (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { id } = await params;
    
// Check if there are existing bookings for this lesson type
    const existingBookings = await db.select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.lessonTypeId, id));

    if (existingBookings.length > 0) {
      // Archive the lesson type instead of deleting
      const archivedLessonType = await db
        .update(lessonTypes)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(lessonTypes.id, id))
        .returning();

      if (!archivedLessonType.length) {
        return NextResponse.json({ error: 'Lesson type not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'Lesson type archived successfully',
        lessonType: archivedLessonType[0] 
      });
    } else {
      // Soft delete by setting isActive to false
      const deletedLessonType = await db
        .update(lessonTypes)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(lessonTypes.id, id))
        .returning();

      if (!deletedLessonType.length) {
        return NextResponse.json({ error: 'Lesson type not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'Lesson type deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting lesson type:', error);
    return NextResponse.json({ error: 'Failed to delete lesson type' }, { status: 500 });
  }
}
