import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessonTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

// GET all lesson types
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const allLessonTypes = await db.select().from(lessonTypes);
    return NextResponse.json(allLessonTypes);
  } catch (error) {
    console.error('Error fetching lesson types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new lesson type
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { name, price, duration, active } = body;

    const newLessonType = await db.insert(lessonTypes).values({
      name,
      price: parseFloat(price),
      duration: parseInt(duration),
      active: active ?? true,
    }).returning();

    return NextResponse.json(newLessonType[0]);
  } catch (error) {
    console.error('Error creating lesson type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update lesson type
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { id, name, price, duration, active } = body;

    await db.update(lessonTypes).set({
      name,
      price: parseFloat(price),
      duration: parseInt(duration),
      active,
    }).where(eq(lessonTypes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lesson type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE lesson type
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lesson type ID required' }, { status: 400 });
    }

    await db.delete(lessonTypes).where(eq(lessonTypes.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
