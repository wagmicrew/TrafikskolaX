import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { handledarBookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  const { id } = await params;
  try {
    const rows = await db.select().from(handledarBookings).where(eq(handledarBookings.sessionId, id));
    const participants = rows.map(r => ({ id: r.id, supervisorName: r.supervisorName, supervisorPhone: r.supervisorPhone }));
    return NextResponse.json({ participants });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }
}



