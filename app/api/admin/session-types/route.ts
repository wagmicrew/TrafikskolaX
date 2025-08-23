import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sessionTypes } from '@/lib/db/schema/session-types';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const types = await db
      .select()
      .from(sessionTypes)
      .orderBy(desc(sessionTypes.sortOrder), desc(sessionTypes.createdAt));

    return NextResponse.json({ sessionTypes: types });
  } catch (error) {
    console.error('Error fetching session types:', error);
    return NextResponse.json({ error: 'Failed to fetch session types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, creditType, basePrice, pricePerSupervisor, durationMinutes, maxParticipants, allowsSupervisors, requiresPersonalId, sortOrder } = body;

    const newType = await db
      .insert(sessionTypes)
      .values({
        name,
        description,
        type,
        creditType,
        basePrice: parseFloat(basePrice),
        pricePerSupervisor: pricePerSupervisor ? parseFloat(pricePerSupervisor) : null,
        durationMinutes,
        maxParticipants,
        allowsSupervisors: Boolean(allowsSupervisors),
        requiresPersonalId: Boolean(requiresPersonalId),
        sortOrder: parseInt(sortOrder) || 0,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      message: 'Session type created successfully',
      sessionType: newType[0]
    });
  } catch (error) {
    console.error('Error creating session type:', error);
    return NextResponse.json({ error: 'Failed to create session type' }, { status: 500 });
  }
}
