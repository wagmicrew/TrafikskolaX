import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriLessonTypes } from '@/lib/db/schema/teori';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const sessionType = await db
      .select()
      .from(teoriLessonTypes)
      .where(eq(teoriLessonTypes.id, id))
      .limit(1);

    if (!sessionType.length) {
      return NextResponse.json({ error: 'Session type not found' }, { status: 404 });
    }

    return NextResponse.json({ sessionType: sessionType[0] });
  } catch (error) {
    console.error('Error fetching session type:', error);
    return NextResponse.json({ error: 'Failed to fetch session type' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, type, creditType, basePrice, pricePerSupervisor, durationMinutes, maxParticipants, allowsSupervisors, requiresPersonalId, sortOrder, isActive } = body;

    const updatedType = await db
      .update(teoriLessonTypes)
      .set({
        name,
        description,
        allowsSupervisors: Boolean(allowsSupervisors),
        price: parseFloat(basePrice),
        pricePerSupervisor: pricePerSupervisor ? parseFloat(pricePerSupervisor) : null,
        durationMinutes,
        maxParticipants,
        isActive: Boolean(isActive),
        sortOrder: parseInt(sortOrder) || 0,
      })
      .where(eq(teoriLessonTypes.id, id))
      .returning();

    if (!updatedType.length) {
      return NextResponse.json({ error: 'Session type not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Session type updated successfully',
      sessionType: updatedType[0]
    });
  } catch (error) {
    console.error('Error updating session type:', error);
    return NextResponse.json({ error: 'Failed to update session type' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deletedType = await db
      .delete(teoriLessonTypes)
      .where(eq(teoriLessonTypes.id, id))
      .returning();

    if (!deletedType.length) {
      return NextResponse.json({ error: 'Session type not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Session type deleted successfully',
      sessionType: deletedType[0]
    });
  } catch (error) {
    console.error('Error deleting session type:', error);
    return NextResponse.json({ error: 'Failed to delete session type' }, { status: 500 });
  }
}
