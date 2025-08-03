import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessonTypes, bookings } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-auth';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth('admin');
    const { id } = await params;
    
    const body = await request.json();
    const { name, description, durationMinutes, price } = body;

    // Validate input
    if (!name || !durationMinutes || price === undefined) {
      return NextResponse.json(
        { error: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    // Update lesson type
    const [updatedLesson] = await db
      .update(lessonTypes)
      .set({
        name,
        description: description || null,
        durationMinutes: parseInt(durationMinutes),
        price: price.toString(),
        updatedAt: new Date(),
      })
      .where(eq(lessonTypes.id, id))
      .returning();

    if (!updatedLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth('admin');
    const { id } = await params;

    // Check if lesson type is used in any bookings
    const existingBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.lessonTypeId, id))
      .limit(1);

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete lesson type that has existing bookings' },
        { status: 400 }
      );
    }

    // Delete lesson type
    const [deletedLesson] = await db
      .delete(lessonTypes)
      .where(eq(lessonTypes.id, id))
      .returning();

    if (!deletedLesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
