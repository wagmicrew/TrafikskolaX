import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teoriLessonTypes, teoriSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check if sample data already exists
    const existingTypes = await db.select().from(teoriLessonTypes).limit(1);
    
    if (existingTypes.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Teori sample data already exists',
        skipped: true
      });
    }

    // Create lesson types
    const lessonTypesData = [
      {
        name: 'Grundkurs Teori',
        description: 'Grundläggande teorilektion för nya studenter',
        allowsSupervisors: false,
        price: '500.00',
        pricePerSupervisor: null,
        durationMinutes: 60,
        maxParticipants: 1,
        sortOrder: 1
      },
      {
        name: 'Risktväan Teori',
        description: 'Teorilektion för risktvåan',
        allowsSupervisors: false,
        price: '500.00',
        pricePerSupervisor: null,
        durationMinutes: 60,
        maxParticipants: 1,
        sortOrder: 2
      },
      {
        name: 'Handledar Teori',
        description: 'Teorilektion med handledare - tidigare Handledarutbildning',
        allowsSupervisors: true,
        price: '700.00',
        pricePerSupervisor: '500.00',
        durationMinutes: 120,
        maxParticipants: 1,
        sortOrder: 3
      }
    ];

    const createdTypes = await db.insert(teoriLessonTypes).values(lessonTypesData).returning();

    // Create sample sessions for each type
    const sessionsData = [];
    const today = new Date();
    
    for (const type of createdTypes) {
      // Create 3 sessions for each type over the next week
      for (let i = 1; i <= 3; i++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + i);
        
        const sessionTime = type.name.includes('Handledar') ? '09:00' : '14:00';
        const endTime = type.name.includes('Handledar') ? '11:00' : '15:00';
        
        sessionsData.push({
          lessonTypeId: type.id,
          title: `${type.name} - ${sessionDate.toLocaleDateString('sv-SE', { weekday: 'long' })}`,
          description: `${type.description}`,
          date: sessionDate.toISOString().split('T')[0],
          startTime: sessionTime,
          endTime: endTime,
          maxParticipants: type.name.includes('Handledar') ? 6 : 8,
          currentParticipants: 0,
          sessionType: type.name.includes('Handledar') ? 'handledar' : 'teori',
          price: type.price,
          isActive: true
        });
      }
    }

    await db.insert(teoriSessions).values(sessionsData);

    return NextResponse.json({
      success: true,
      message: `Created ${createdTypes.length} lesson types and ${sessionsData.length} sample sessions`,
      details: {
        lessonTypes: createdTypes.length,
        sessions: sessionsData.length
      }
    });

  } catch (error) {
    console.error('Error creating Teori sample data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create Teori sample data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
