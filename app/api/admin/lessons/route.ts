import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessonTypes } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth('admin');
    
    const body = await request.json();
    const { name, description, durationMinutes, price } = body;

    // Validate input
    if (!name || !durationMinutes || price === undefined) {
      return NextResponse.json(
        { error: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    // Create new lesson type
    const [newLesson] = await db
      .insert(lessonTypes)
      .values({
        id: uuidv4(),
        name,
        description: description || null,
        durationMinutes: parseInt(durationMinutes),
        price: price.toString(),
      })
      .returning();

    return NextResponse.json(newLesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
