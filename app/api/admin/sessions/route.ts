import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema/sessions';
import { sessionTypes } from '@/lib/db/schema/session-types';
import { desc, eq, and, gte, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'future';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

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
        teacherId: sessions.teacherId,
        isActive: sessions.isActive,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        sessionType: {
          id: sessionTypes.id,
          name: sessionTypes.name,
          type: sessionTypes.type,
          basePrice: sessionTypes.basePrice,
          pricePerSupervisor: sessionTypes.pricePerSupervisor,
          allowsSupervisors: sessionTypes.allowsSupervisors,
          requiresPersonalId: sessionTypes.requiresPersonalId,
        }
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id));

    // Apply scope filter
    if (scope === 'future') {
      query = query.where(gte(sessions.date, today));
    } else if (scope === 'past') {
      query = query.where(lte(sessions.date, today));
    }

    const sessionList = await query
      .orderBy(desc(sessions.date), desc(sessions.startTime))
      .limit(pageSize)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sessions.id })
      .from(sessions);

    if (scope === 'future') {
      countQuery.where(gte(sessions.date, today));
    } else if (scope === 'past') {
      countQuery.where(lte(sessions.date, today));
    }

    const totalCount = await countQuery;
    const totalPages = Math.ceil(totalCount.length / pageSize);

    return NextResponse.json({
      sessions: sessionList,
      page,
      totalPages,
      total: totalCount.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionTypeId, title, description, date, startTime, endTime, maxParticipants, isActive } = body;

    const newSession = await db
      .insert(sessions)
      .values({
        sessionTypeId,
        title,
        description,
        date,
        startTime,
        endTime,
        maxParticipants: parseInt(maxParticipants) || 1,
        currentParticipants: 0,
        isActive: Boolean(isActive),
      })
      .returning();

    // Get the complete session with type info
    const sessionWithType = await db
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
        updatedAt: sessions.updatedAt,
        sessionType: {
          id: sessionTypes.id,
          name: sessionTypes.name,
          type: sessionTypes.type,
          basePrice: sessionTypes.basePrice,
          pricePerSupervisor: sessionTypes.pricePerSupervisor,
          allowsSupervisors: sessionTypes.allowsSupervisors,
          requiresPersonalId: sessionTypes.requiresPersonalId,
        }
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(eq(sessions.id, newSession[0].id))
      .limit(1);

    return NextResponse.json({
      message: 'Session created successfully',
      session: sessionWithType[0]
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
