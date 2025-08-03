import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, users } from '@/lib/db/schema';
import { eq, gte, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupedView = searchParams.get('grouped') === 'true';
    const today = new Date().toISOString().split('T')[0];

    // Get available sessions (future sessions with available spots)
    const sessions = await db
      .select({
        id: handledarSessions.id,
        title: handledarSessions.title,
        description: handledarSessions.description,
        date: handledarSessions.date,
        startTime: handledarSessions.startTime,
        endTime: handledarSessions.endTime,
        maxParticipants: handledarSessions.maxParticipants,
        currentParticipants: handledarSessions.currentParticipants,
        pricePerParticipant: handledarSessions.pricePerParticipant,
        teacherId: handledarSessions.teacherId,
        teacherName: users.firstName,
        teacherLastName: users.lastName,
      })
      .from(handledarSessions)
      .leftJoin(users, eq(handledarSessions.teacherId, users.id))
      .where(
        and(
          eq(handledarSessions.isActive, true),
          gte(handledarSessions.date, today)
        )
      )
      .orderBy(handledarSessions.date, handledarSessions.startTime);

    // Filter sessions with available spots
    const availableSessions = sessions
      .filter(session => session.currentParticipants < session.maxParticipants)
      .map(session => ({
        ...session,
        teacherName: session.teacherName && session.teacherLastName 
          ? `${session.teacherName} ${session.teacherLastName}` 
          : 'Lärare ej tilldelad',
        spotsLeft: session.maxParticipants - session.currentParticipants,
        formattedDateTime: formatSessionDateTime(session.date, session.startTime, session.endTime),
      }));

    // If grouped view is requested, return a summary
    if (groupedView && availableSessions.length > 0) {
      const groupedSession = {
        id: 'handledarutbildning-group',
        title: 'Handledarutbildning',
        type: 'handledar',
        description: `${availableSessions.length} kurser tillgängliga`,
        availableSessions: availableSessions.length,
        pricePerParticipant: availableSessions[0]?.pricePerParticipant || 0,
        durationMinutes: 120,
        isActive: true
      };
      return NextResponse.json({ sessions: [groupedSession], hasAvailableSessions: true });
    }

    return NextResponse.json({ sessions: availableSessions, hasAvailableSessions: availableSessions.length > 0 });
  } catch (error) {
    console.error('Error fetching available handledar sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatSessionDateTime(date: string, startTime: string, endTime: string): string {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `${formattedDate}, ${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
}
