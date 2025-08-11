import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { userFeedback, bookingSteps } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params; // userId

    // Get latest feedback per stepIdentifier for the user
    const feedbackRows = await db
      .select({ stepIdentifier: userFeedback.stepIdentifier, valuation: userFeedback.valuation, createdAt: userFeedback.createdAt })
      .from(userFeedback)
      .where(eq(userFeedback.userId, id))
      .orderBy(desc(userFeedback.createdAt));

    const latestByStep = new Map<string, number | null>();
    for (const row of feedbackRows) {
      if (!row.stepIdentifier) continue;
      if (!latestByStep.has(row.stepIdentifier)) {
        latestByStep.set(row.stepIdentifier, row.valuation ?? null);
      }
    }

    const steps = await db.select().from(bookingSteps);
    // Aggregate per category
    const categoryToVals: Record<string, Array<number>> = {};
    for (const s of steps) {
      const key = `${s.category}-${s.subcategory}`;
      const v = latestByStep.get(key);
      if (v == null) continue;
      categoryToVals[s.category] ||= [];
      categoryToVals[s.category].push(v);
    }

    const categoryStatus: Record<string, 'green'|'orange'|'red'|'unknown'> = {};
    for (const s of steps) {
      const vals = categoryToVals[s.category];
      if (!vals || vals.length === 0) {
        if (!(s.category in categoryStatus)) categoryStatus[s.category] = 'unknown';
        continue;
      }
      const anyRed = vals.some(v => v <= 3);
      const anyOrange = !anyRed && vals.some(v => v >= 4 && v <= 6);
      categoryStatus[s.category] = anyRed ? 'red' : anyOrange ? 'orange' : 'green';
    }

    return NextResponse.json({ statusByCategory: categoryStatus });
  } catch (error) {
    console.error('Education summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


