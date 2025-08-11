import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { bookingPlanItems } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

async function ensurePlanTableExists() {
  // Create table and index if missing (idempotent)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS booking_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    step_identifier VARCHAR(50) NOT NULL,
    added_by UUID REFERENCES users(id),
    is_selected BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_plan_items_unique ON booking_plan_items(booking_id, step_identifier)`);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await ensurePlanTableExists();
    const rows = await db
      .select({ stepIdentifier: bookingPlanItems.stepIdentifier })
      .from(bookingPlanItems)
      .where(and(eq(bookingPlanItems.bookingId, id), eq(bookingPlanItems.isSelected, true)));
    return NextResponse.json({ planned: rows.map(r => r.stepIdentifier) });
  } catch (error) {
    console.error('GET plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const planned: string[] = Array.isArray(body?.planned) ? body.planned : [];

    await ensurePlanTableExists();
    const currentRows = await db
      .select({ stepIdentifier: bookingPlanItems.stepIdentifier })
      .from(bookingPlanItems)
      .where(eq(bookingPlanItems.bookingId, id));
    const current = new Set(currentRows.map(r => r.stepIdentifier));
    const next = new Set(planned);

    const toAdd = [...next].filter(x => !current.has(x));
    const toRemove = [...current].filter(x => !next.has(x));

    if (toAdd.length > 0) {
      await db.insert(bookingPlanItems).values(
        toAdd.map(stepIdentifier => ({ bookingId: id, stepIdentifier, addedBy: user.userId, isSelected: true }))
      );
    }

    if (toRemove.length > 0) {
      // Set isSelected=false for removed (soft removal for history)
      await db
        .update(bookingPlanItems)
        .set({ isSelected: false })
        .where(and(eq(bookingPlanItems.bookingId, id), inArray(bookingPlanItems.stepIdentifier, toRemove)));
    }

    return NextResponse.json({ success: true, added: toAdd.length, removed: toRemove.length });
  } catch (error) {
    console.error('PUT plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


