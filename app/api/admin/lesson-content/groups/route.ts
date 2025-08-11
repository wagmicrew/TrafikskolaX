import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookingSteps } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'name required' }, { status: 400 });
    // Determine next step number within this category
    const maxRes = await db.execute(sql`SELECT COALESCE(MAX(step_number), 0) as max FROM booking_steps WHERE category = ${name}`);
    const nextStep = Number((maxRes.rows?.[0] as any)?.max || 0) + 1;
    // Create an initial placeholder item under this category
    const inserted = await db.insert(bookingSteps).values({
      stepNumber: nextStep,
      category: name,
      subcategory: 'Ny punkt',
      description: ''
    }).returning();
    return NextResponse.json({ success: true, group: { id: name, name, sortOrder: nextStep, isActive: true }, item: inserted[0] });
  } catch (e) {
    console.error('Create group error:', e);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}


