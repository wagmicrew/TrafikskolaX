import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { qliroOrders } from '@/lib/db/schema';
import { and, eq, or, lt, isNull } from 'drizzle-orm';
import { qliroService } from '@/lib/payment/qliro-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json().catch(() => ({}));
    const max = Number(body.max || 20);
    const minutes = Number(body.minutes || 30);
    const cutoff = new Date(Date.now() - minutes * 60_000);

    // Stale are non-final states with lastStatusCheck before cutoff
    const candidates = await db
      .select()
      .from(qliroOrders)
      .where(
        and(
          or(
            eq(qliroOrders.status, 'created'),
            eq(qliroOrders.status, 'pending')
          ),
          or(isNull(qliroOrders.lastStatusCheck), lt(qliroOrders.lastStatusCheck, cutoff))
        )
      )
      .limit(max);

    const results: any[] = [];
    for (const o of candidates) {
      try {
        const latest = await qliroService.getOrder(o.qliroOrderId as string);
        const status = latest?.Status || latest?.status || 'pending';
        const link = latest?.PaymentLink || null;
        await qliroService.updateOrderStatus(o.qliroOrderId as string, status, link || undefined);
        results.push({ id: o.id, qliroOrderId: o.qliroOrderId, status, ok: true });
      } catch (e: any) {
        results.push({ id: o.id, qliroOrderId: o.qliroOrderId, ok: false, error: e?.message || 'fetch error' });
      }
    }

    return NextResponse.json({ updated: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to refresh stale orders' }, { status: 500 });
  }
}


