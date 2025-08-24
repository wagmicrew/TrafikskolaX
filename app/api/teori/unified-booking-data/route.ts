import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { teoriLessonTypes, teoriSessions, handledarSessions } from '@/lib/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch active Teori lesson types
    const teoriTypes = await db
      .select()
      .from(teoriLessonTypes)
      .where(eq(teoriLessonTypes.isActive, true))
      .orderBy(teoriLessonTypes.name);

    // Fetch upcoming Teori sessions
    const currentDate = new Date().toISOString().split('T')[0];
    const teoriSessionsData = await db
      .select({
        id: teoriSessions.id,
        lessonTypeId: teoriSessions.lessonTypeId,
        title: teoriSessions.title,
        description: teoriSessions.description,
        date: teoriSessions.date,
        startTime: teoriSessions.startTime,
        endTime: teoriSessions.endTime,
        maxParticipants: teoriSessions.maxParticipants,
        currentParticipants: teoriSessions.currentParticipants,
        price: teoriSessions.price,
        isActive: teoriSessions.isActive
      })
      .from(teoriSessions)
      .where(
        and(
          eq(teoriSessions.isActive, true),
          gte(teoriSessions.date, currentDate)
        )
      )
      .orderBy(teoriSessions.date, teoriSessions.startTime);

    // Fetch upcoming Handledar sessions (to be integrated as a session type)
    const handledarSessionsData = await db
      .select({
        id: handledarSessions.id,
        title: handledarSessions.title,
        description: handledarSessions.description,
        date: handledarSessions.date,
        startTime: handledarSessions.startTime,
        endTime: handledarSessions.endTime,
        maxParticipants: handledarSessions.maxParticipants,
        currentParticipants: handledarSessions.currentParticipants,
        price: handledarSessions.price,
        isActive: handledarSessions.isActive
      })
      .from(handledarSessions)
      .where(
        and(
          eq(handledarSessions.isActive, true),
          gte(handledarSessions.date, currentDate)
        )
      )
      .orderBy(handledarSessions.date, handledarSessions.startTime);

    // Create unified lesson types structure
    const unifiedLessonTypes = [
      // Regular Teori lesson types
      ...teoriTypes.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        allowsSupervisors: type.allowsSupervisors,
        price: type.price,
        pricePerSupervisor: type.pricePerSupervisor,
        durationMinutes: type.durationMinutes,
        maxParticipants: type.maxParticipants,
        isActive: type.isActive,
        type: 'teori' as const,
        sessions: teoriSessionsData
          .filter(session => session.lessonTypeId === type.id)
          .map(session => ({
            id: session.id,
            title: session.title,
            description: session.description,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            maxParticipants: session.maxParticipants,
            currentParticipants: session.currentParticipants,
            price: parseFloat(session.price),
            allowsSupervisors: type.allowsSupervisors,
            pricePerSupervisor: type.pricePerSupervisor ? parseFloat(type.pricePerSupervisor) : undefined,
            availableSpots: session.maxParticipants - session.currentParticipants,
            formattedDateTime: formatDateTime(session.date, session.startTime, session.endTime),
            sessionType: 'teori' as const
          }))
      })),
      
      // Handledar sessions as a unified lesson type
      {
        id: 'handledar-unified',
        name: 'Handledar Teori',
        description: 'Teorilektion med handledare - tidigare Handledarutbildning',
        allowsSupervisors: true,
        price: '700.00',
        pricePerSupervisor: '500.00',
        durationMinutes: 120,
        maxParticipants: 1,
        isActive: true,
        type: 'handledar' as const,
        sessions: handledarSessionsData.map(session => ({
          id: session.id,
          title: session.title,
          description: session.description,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          maxParticipants: session.maxParticipants,
          currentParticipants: session.currentParticipants,
          price: parseFloat(session.price),
          allowsSupervisors: true,
          pricePerSupervisor: 500,
          availableSpots: session.maxParticipants - session.currentParticipants,
          formattedDateTime: formatDateTime(session.date, session.startTime, session.endTime),
          sessionType: 'handledar' as const
        }))
      }
    ].filter(type => type.sessions.length > 0); // Only include types with available sessions

    return NextResponse.json({
      success: true,
      lessonTypes: unifiedLessonTypes,
      totalTypes: unifiedLessonTypes.length,
      totalSessions: unifiedLessonTypes.reduce((sum, type) => sum + type.sessions.length, 0)
    });

  } catch (error) {
    console.error('Error fetching unified booking data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatDateTime(date: string, startTime: string, endTime: string): string {
  try {
    const sessionDate = new Date(date);
    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
    const monthNames = [
      'januari', 'februari', 'mars', 'april', 'maj', 'juni',
      'juli', 'augusti', 'september', 'oktober', 'november', 'december'
    ];
    
    const dayName = dayNames[sessionDate.getDay()];
    const day = sessionDate.getDate();
    const month = monthNames[sessionDate.getMonth()];
    const year = sessionDate.getFullYear();
    
    return `${dayName} ${day} ${month} ${year}, ${startTime} - ${endTime}`;
  } catch (error) {
    return `${date}, ${startTime} - ${endTime}`;
  }
}
