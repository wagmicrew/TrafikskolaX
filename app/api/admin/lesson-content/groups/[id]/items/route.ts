import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookingSteps } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  const { id: groupId } = await params;
  try {
    const { title, description } = await request.json();
    if (!title || typeof title !== 'string') return NextResponse.json({ error: 'title required' }, { status: 400 });
    // Compute next step number within this category (groupId is category name in our mapping)
    const maxRes = await db.execute(sql`SELECT COALESCE(MAX(step_number), 0) as max FROM booking_steps WHERE category = ${groupId}`);
    const nextStep = Number((maxRes.rows?.[0] as any)?.max || 0) + 1;
    const [created] = await db.insert(bookingSteps).values({
      stepNumber: nextStep,
      category: groupId,
      subcategory: title,
      description: description || ''
    }).returning();
    return NextResponse.json({ success: true, item: { id: `${created.id}`, groupId, title, description: created.description, durationMinutes: null, sortOrder: created.stepNumber, isActive: true } });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}


