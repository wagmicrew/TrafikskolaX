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
    
    console.log("[HANDLEDAR API DEBUG] Request received")
    console.log("[HANDLEDAR API DEBUG] Grouped view:", groupedView)
    console.log("[HANDLEDAR API DEBUG] Today date:", today)

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

    console.log("[HANDLEDAR API DEBUG] Raw sessions from DB:", sessions.length)
    sessions.forEach(s => console.log(`[HANDLEDAR API DEBUG] Session: ${s.title}, date: ${s.date}, active: ${handledarSessions.isActive}, participants: ${s.currentParticipants}/${s.maxParticipants}`))

    // Filter sessions with available spots
    const availableSessions = sessions
      .filter(session => (session.currentParticipants ?? 0) < (session.maxParticipants ?? 0))
      .map(session => ({
        ...session,
        teacherName: session.teacherName && session.teacherLastName 
          ? `${session.teacherName} ${session.teacherLastName}` 
          : 'Lärare ej tilldelad',
        spotsLeft: (session.maxParticipants ?? 0) - (session.currentParticipants ?? 0),
        formattedDateTime: formatSessionDateTime(session.date, session.startTime, session.endTime),
      }));

    console.log("[HANDLEDAR API DEBUG] Available sessions after filter:", availableSessions.length)

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
