import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, users } from '@/lib/db/schema';
import { eq, desc, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
        isActive: handledarSessions.isActive,
        createdAt: handledarSessions.createdAt,
      })
      .from(handledarSessions)
      .leftJoin(users, eq(handledarSessions.teacherId, users.id))
      .where(eq(handledarSessions.isActive, true))
      .orderBy(desc(handledarSessions.date));

    const formattedSessions = sessions.map(session => ({
      ...session,
      teacherName: session.teacherName && session.teacherLastName 
        ? `${session.teacherName} ${session.teacherLastName}` 
        : 'Ingen lärare tilldelad',
      spotsLeft: session.maxParticipants - session.currentParticipants,
    }));

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
      pricePerParticipant: parseFloat(pricePerParticipant),
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
