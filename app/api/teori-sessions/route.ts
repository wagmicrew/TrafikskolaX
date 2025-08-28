import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, gte, and, sql, count } from 'drizzle-orm';
import { teoriLessonTypes, teoriSessions, teoriBookings } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'future';
    const lessonTypeId = searchParams.get('typeId') || searchParams.get('lessonTypeId'); // Support both parameter names for compatibility
    const today = new Date().toISOString().split('T')[0];

    // Fetch Teori lesson types using Drizzle ORM
    const lessonTypeConditions = [eq(teoriLessonTypes.isActive, true)];
    if (lessonTypeId) {
      lessonTypeConditions.push(eq(teoriLessonTypes.id, lessonTypeId));
    }

    let lessonTypes;
    try {
      lessonTypes = await db
        .select()
        .from(teoriLessonTypes)
        .where(and(...lessonTypeConditions))
        .orderBy(teoriLessonTypes.sortOrder, teoriLessonTypes.name);
    } catch (error) {
      console.error('Error querying Teori lesson types:', error);
      return NextResponse.json({
        sessions: [],
        sessionsByType: [],
        totalAvailable: 0,
        lessonTypes: [],
        error: 'Teori tables not yet initialized. Please run the migration first.',

      }, { status: 200 });
    }

    // Fetch sessions with proper booking counts and future date filtering
    const sessionConditions = [
      eq(teoriSessions.isActive, true),
      gte(teoriSessions.date, today) // Only future sessions
    ];
    
    // Add lesson type filtering if specified
    if (lessonTypeId) {
      sessionConditions.push(eq(teoriSessions.lessonTypeId, lessonTypeId));
    }

    let sessions;
    try {
      const sessionsQuery = db
        .select({
          id: teoriSessions.id,
          title: teoriSessions.title,
          description: teoriSessions.description,
          date: teoriSessions.date,
          startTime: teoriSessions.startTime,
          endTime: teoriSessions.endTime,
          maxParticipants: teoriSessions.maxParticipants,
          currentParticipants: teoriSessions.currentParticipants,
          isActive: teoriSessions.isActive,
          createdAt: teoriSessions.createdAt,
          updatedAt: teoriSessions.updatedAt,
          lessonTypeId: teoriSessions.lessonTypeId,
          lessonType: {
            id: teoriLessonTypes.id,
            name: teoriLessonTypes.name,
            allowsSupervisors: teoriLessonTypes.allowsSupervisors,
            price: teoriLessonTypes.price,
            pricePerSupervisor: teoriLessonTypes.pricePerSupervisor,
            durationMinutes: teoriLessonTypes.durationMinutes,
            maxParticipants: teoriLessonTypes.maxParticipants,
          },
          bookedCount: count(teoriBookings.id)
        })
        .from(teoriSessions)
        .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
        .leftJoin(teoriBookings, and(
          eq(teoriSessions.id, teoriBookings.sessionId),
          sql`${teoriBookings.status} != 'cancelled'`
        ))
        .where(and(...sessionConditions))
        .groupBy(
          teoriSessions.id,
          teoriSessions.title,
          teoriSessions.description,
          teoriSessions.date,
          teoriSessions.startTime,
          teoriSessions.endTime,
          teoriSessions.maxParticipants,
          teoriSessions.currentParticipants,
          teoriSessions.isActive,
          teoriSessions.createdAt,
          teoriSessions.updatedAt,
          teoriSessions.lessonTypeId,
          teoriLessonTypes.id,
          teoriLessonTypes.name,
          teoriLessonTypes.description,
          teoriLessonTypes.allowsSupervisors,
          teoriLessonTypes.price,
          teoriLessonTypes.pricePerSupervisor,
          teoriLessonTypes.durationMinutes,
          teoriLessonTypes.maxParticipants
        )
        .orderBy(teoriSessions.date, teoriSessions.startTime);

      sessions = await sessionsQuery;
    } catch (error) {
      console.error('Error querying Teori sessions:', error);
      return NextResponse.json({
        sessions: [],
        sessionsByType: [],
        totalAvailable: 0,
        lessonTypes: [],
        error: 'Teori tables not yet initialized. Please run the migration first.',
        needsSetup: true
      }, { status: 200 });
    }

    // Process sessions to include availability information
    const processedSessions = sessions.map((session: any) => ({
      ...session,
      availableSpots: (session.maxParticipants || 0) - (session.currentParticipants || 0) - (session.bookedCount || 0),
      is_available: ((session.maxParticipants || 0) - (session.currentParticipants || 0) - (session.bookedCount || 0)) > 0,
      type: session.allowsSupervisors ? 'handledar' : 'teori',
      formattedDateTime: formatDateTime(session.date, session.startTime, session.endTime),
      // Use lesson type price (session-specific pricing would need DB migration)
      price: parseFloat(session.price || '0'),
      durationMinutes: session.durationMinutes || 60,
      allowsSupervisors: session.allowsSupervisors || false,
      pricePerSupervisor: session.pricePerSupervisor ? parseFloat(session.pricePerSupervisor) : null,
    }));

    // Filter available sessions
    const availableSessions = processedSessions.filter((session: any) => session.is_available);

    // Group by lesson type for better presentation (only include lesson types with sessions)
    const sessionsByType = lessonTypes
      .map((lessonType: any) => {
        const typeId = lessonType.id;
        // For handledar sessions (allowsSupervisors=true), include ALL sessions, not just available ones
        const lessonTypeSessions = lessonType.allowsSupervisors 
          ? processedSessions.filter((session: any) => session.lessonTypeId === typeId)
          : availableSessions.filter((session: any) => session.lessonTypeId === typeId);

        return {
          lessonType: {
            id: typeId,
            name: lessonType.name,
            description: lessonType.description,
            allowsSupervisors: lessonType.allowsSupervisors,
            price: lessonType.price,
            pricePerSupervisor: lessonType.pricePerSupervisor,
            durationMinutes: lessonType.durationMinutes,
            maxParticipants: lessonType.maxParticipants,
            type: lessonType.allowsSupervisors ? 'handledar' : 'teori',
          },
          sessions: lessonTypeSessions,
          hasAvailableSessions: lessonTypeSessions.length > 0
        };
      })
      .filter((group: any) => group.sessions.length > 0); // Only include lesson types that have sessions

    return NextResponse.json({
      sessions: availableSessions,
      sessionsByType: sessionsByType,
      totalAvailable: availableSessions.length,
      lessonTypes: lessonTypes
    });

  } catch (error) {
    console.error('Error fetching Teori sessions:', error);
    return NextResponse.json({
      error: 'Failed to fetch Teori sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatDateTime(date: string, startTime: string, endTime: string): string {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `${formattedDate}, ${startTime?.slice(0, 5)} - ${endTime?.slice(0, 5)}`;
}
