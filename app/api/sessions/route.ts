import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, sessionTypes } from '@/lib/db/schema';
import { eq, gte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'future';
    const typeId = searchParams.get('typeId');
    
    const today = new Date().toISOString().split('T')[0];

    let query = db
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
        isActive: sessions.isActive,
        sessionType: {
          id: sessionTypes.id,
          name: sessionTypes.name,
          type: sessionTypes.type,
          basePrice: sessionTypes.basePrice,
          pricePerSupervisor: sessionTypes.pricePerSupervisor,
          allowsSupervisors: sessionTypes.allowsSupervisors,
          requiresPersonalId: sessionTypes.requiresPersonalId,
          durationMinutes: sessionTypes.durationMinutes,
        }
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(
        and(
          eq(sessions.isActive, true),
          eq(sessionTypes.isActive, true)
        )
      );

    // Apply scope filter
    if (scope === 'future') {
      query = query.where(
        and(
          gte(sessions.date, today),
          eq(sessions.isActive, true),
          eq(sessionTypes.isActive, true)
        )
      );
    }

    // Filter by session type if specified
    if (typeId) {
      query = query.where(
        and(
          gte(sessions.date, today),
          eq(sessions.isActive, true),
          eq(sessionTypes.isActive, true),
          eq(sessions.sessionTypeId, typeId)
        )
      );
    }

    const sessionList = await query.orderBy(sessions.date, sessions.startTime);

    return NextResponse.json({ sessions: sessionList });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
