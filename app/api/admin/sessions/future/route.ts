import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema/sessions';
import { sessionTypes } from '@/lib/db/schema/session-types';
import { gte, eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    const futureSessions = await db
      .select({
        id: sessions.id,
        sessionTypeId: sessions.sessionTypeId,
        title: sessions.title,
        description: sessions.description,
        date: sessions.date,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        maxParticipants: sessions.maxParticipants,
        currentParticipants: sessions.currentParticipants,
        teacherId: sessions.teacherId,
        isActive: sessions.isActive,
        createdAt: sessions.createdAt,
        sessionType: {
          id: sessionTypes.id,
          name: sessionTypes.name,
          type: sessionTypes.type,
          basePrice: sessionTypes.basePrice,
          allowsSupervisors: sessionTypes.allowsSupervisors,
        }
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(gte(sessions.date, today))
      .orderBy(sessions.date, sessions.startTime);

    return NextResponse.json({ sessions: futureSessions });
  } catch (error) {
    console.error('Error fetching future sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch future sessions' }, { status: 500 });
  }
}
