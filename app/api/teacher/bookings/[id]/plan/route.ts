import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { bookings, bookingPlanItems, bookingSteps } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

async function ensurePlanAccess(bookingId: string, userId: string) {
  const result = await db
    .select({ teacherId: bookings.teacherId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (result.length === 0) return { ok: false, status: 404, error: 'Booking not found' } as const;
  if (result[0].teacherId !== userId) return { ok: false, status: 403, error: 'Access denied' } as const;
  return { ok: true } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const access = await ensurePlanAccess(bookingId, user.userId || user.id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const plan = await db
      .select({ id: bookingPlanItems.id, stepIdentifier: bookingPlanItems.stepIdentifier, isSelected: bookingPlanItems.isSelected })
      .from(bookingPlanItems)
      .where(eq(bookingPlanItems.bookingId, bookingId));

    const steps = await db.select().from(bookingSteps).orderBy(bookingSteps.stepNumber);

    return NextResponse.json({ plan, steps });
  } catch (error) {
    console.error('Teacher get plan error:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const access = await ensurePlanAccess(bookingId, user.userId || user.id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const { selectedStepIdentifiers }: { selectedStepIdentifiers: string[] } = await request.json();
    if (!Array.isArray(selectedStepIdentifiers)) {
      return NextResponse.json({ error: 'selectedStepIdentifiers must be an array' }, { status: 400 });
    }

    // Fetch existing plan items
    const existing = await db
      .select({ id: bookingPlanItems.id, stepIdentifier: bookingPlanItems.stepIdentifier })
      .from(bookingPlanItems)
      .where(eq(bookingPlanItems.bookingId, bookingId));

    const existingMap = new Map(existing.map(i => [i.stepIdentifier, i.id]));
    const selectedSet = new Set(selectedStepIdentifiers);

    // Upsert: set isSelected true for selected, false for unselected; create missing selected rows
    for (const stepId of selectedSet) {
      const existingId = existingMap.get(stepId);
      if (existingId) {
        await db.update(bookingPlanItems).set({ isSelected: true, updatedAt: new Date() }).where(eq(bookingPlanItems.id, existingId));
      } else {
        await db.insert(bookingPlanItems).values({ bookingId, stepIdentifier: stepId, isSelected: true });
      }
    }

    for (const [stepId, rowId] of existingMap.entries()) {
      if (!selectedSet.has(stepId)) {
        await db.update(bookingPlanItems).set({ isSelected: false, updatedAt: new Date() }).where(eq(bookingPlanItems.id, rowId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher update plan error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}




