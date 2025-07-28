import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessonTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allLessonTypes = await db
      .select()
      .from(lessonTypes)
      .where(eq(lessonTypes.isActive, true))
      .orderBy(lessonTypes.price);

    return NextResponse.json({ lessonTypes: allLessonTypes });
  } catch (error) {
    console.error('Error fetching lesson types:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson types' }, { status: 500 });
  }
}
