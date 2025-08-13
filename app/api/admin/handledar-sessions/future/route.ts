import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { handledarSessions } from '@/lib/db/schema';
import { gt } from 'drizzle-orm';

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const today = new Date();
    const sessions = await db
      .select()
      .from(handledarSessions)
      .where(gt(handledarSessions.date as any, today as any));
    return NextResponse.json({ sessions });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



