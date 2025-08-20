import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, users, handledarBookings } from '@/lib/db/schema';
import { eq, desc, and, lt, ne, or, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const scope = (url.searchParams.get('scope') || 'future').toLowerCase();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = 10;
    const today = new Date();
    // zero out time for date-only comparisons
    today.setHours(0,0,0,0);
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Cleanup: remove stale temporary/unpaid handledar bookings (older than 15 minutes)
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      await db
        .delete(handledarBookings)
        .where(
          and(
            lt(handledarBookings.createdAt as any, fifteenMinutesAgo as any),
            ne(handledarBookings.paymentStatus as any, 'paid' as any),
            ne(handledarBookings.status as any, 'confirmed' as any),
            eq(handledarBookings.supervisorName as any, 'Temporary' as any)
          )
        );
    } catch (e) {
      console.error('Failed to cleanup stale handledar bookings', e);
    }

    // Base select
    let baseQuery = db
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
        isActive: handledarSessions.isActive,
        createdAt: handledarSessions.createdAt,
      })
      .from(handledarSessions)
      .leftJoin(users, eq(handledarSessions.teacherId, users.id))
      .where(eq(handledarSessions.isActive, true));

    if (scope === 'future') {
      baseQuery = (baseQuery as any)
        .where(and(eq(handledarSessions.isActive, true), gte(handledarSessions.date as any, today as any)))
        .orderBy(desc(handledarSessions.date));
    } else {
      // past
      baseQuery = (baseQuery as any)
        .where(and(eq(handledarSessions.isActive, true), lt(handledarSessions.date as any, today as any)))
        .orderBy(desc(handledarSessions.date));
    }

    let totalPages = 1;
    if (scope === 'past') {
      const totalRows = await db
        .select({ count: sql`count(*)` })
        .from(handledarSessions)
        .where(and(eq(handledarSessions.isActive, true), lt(handledarSessions.date as any, today as any)));
      const totalCount = Number(totalRows?.[0]?.count || 0);
      totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const offset = (page - 1) * pageSize;
      // Apply pagination
      baseQuery = (baseQuery as any).limit(pageSize).offset(offset);
    }

    const sessions = await (baseQuery as any);

    // Compute participant counts excluding temporary names
    const sessionIds = (sessions as any[]).map((s: any) => s.id);
    const bookings = sessionIds.length ? await db
      .select({ sessionId: handledarBookings.sessionId, supervisorName: handledarBookings.supervisorName, status: handledarBookings.status })
      .from(handledarBookings)
      .where(
        and(
          ne(handledarBookings.supervisorName as any, 'Temporary' as any),
          or(eq(handledarBookings.status as any, 'pending' as any), eq(handledarBookings.status as any, 'confirmed' as any))
        )
      ) : [];

    const countMap: Record<string, number> = {};
    for (const b of bookings) {
      const key = String(b.sessionId);
      countMap[key] = (countMap[key] || 0) + 1;
    }

    const formattedSessions = (sessions as any[]).map((session: any) => {
      const computed = countMap[String(session.id)] || 0;
      return {
        ...session,
        currentParticipants: computed,
        teacherName: session.teacherName && session.teacherLastName 
          ? `${session.teacherName} ${session.teacherLastName}` 
          : 'Ingen lärare tilldelad',
        spotsLeft: Number(session.maxParticipants) - computed,
      };
    });

    if (scope === 'past') {
      return NextResponse.json({ sessions: formattedSessions, page, totalPages });
    }
    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching handledar sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, date, startTime, endTime, maxParticipants, pricePerParticipant, teacherId } = body;

    if (!title || !date || !startTime || !endTime || !pricePerParticipant) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newSession = await db.insert(handledarSessions).values({
      title,
      description,
      date,
      startTime,
      endTime,
      maxParticipants: parseInt(maxParticipants) || 2,
      currentParticipants: 0,
      pricePerParticipant: String(parseFloat(pricePerParticipant)),
      teacherId: teacherId || null,
      isActive: true,
    }).returning();

    return NextResponse.json({ 
      message: 'Handledar session created successfully', 
      session: newSession[0] 
    });
  } catch (error) {
    console.error('Error creating handledar session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
