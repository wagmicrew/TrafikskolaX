import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teoriLessonTypes } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const lessonTypes = await db
      .select()
      .from(teoriLessonTypes)
      .orderBy(desc(teoriLessonTypes.sortOrder), teoriLessonTypes.name);

    return NextResponse.json({
      success: true,
      lessonTypes
    });
  } catch (error) {
    console.error('Error fetching lesson types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const newLessonType = await db
      .insert(teoriLessonTypes)
      .values({
        name: data.name,
        description: data.description || null,
        allowsSupervisors: data.allowsSupervisors || false,
        price: data.price,
        pricePerSupervisor: data.pricePerSupervisor || null,
        durationMinutes: data.durationMinutes || 60,
        maxParticipants: data.maxParticipants || 1,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0
      })
      .returning();

    return NextResponse.json({
      success: true,
      lessonType: newLessonType[0]
    });
  } catch (error) {
    console.error('Error creating lesson type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson type' },
      { status: 500 }
    );
  }
}
