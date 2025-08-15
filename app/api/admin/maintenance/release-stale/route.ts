import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases } from '@/lib/db/schema';
import { and, lt, ne, eq, inArray, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

export async function GET(request: NextRequest) {
  // Token-based auth for cron
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || '';
  const expected = process.env.MAINTENANCE_TOKEN || '';
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const minutes = Math.max(1, Math.min(1440, Number(searchParams.get('minutes') || 15)));
  const cutoff = minutesAgo(minutes);

  const results: Record<string, any> = {};

  // Release stale regular bookings: temp/on_hold older than cutoff and not paid
  try {
    const res = await db.update(bookings)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
        // Append note (Drizzle lacks concat helper; use sql)
        notes: sql`COALESCE(${bookings.notes}, '') || ${'\n[auto] Hold expired; released by cron'}`,
      })
      .where(and(
        inArray(bookings.status, ['temp', 'on_hold'] as any),
        ne(bookings.paymentStatus, 'paid'),
        lt(bookings.createdAt, cutoff as any),
      ));
    results.bookingsReleased = (res as any)?.rowCount ?? undefined;
  } catch (e: any) {
    results.bookingsError = e?.message || 'failed';
  }

  // Release stale handledar bookings: pending older than cutoff and not paid
  try {
    const res = await db.update(handledarBookings)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(handledarBookings.status, 'pending' as any),
        ne(handledarBookings.paymentStatus, 'paid' as any),
        lt(handledarBookings.createdAt, cutoff as any),
      ));
    results.handledarReleased = (res as any)?.rowCount ?? undefined;
  } catch (e: any) {
    results.handledarError = e?.message || 'failed';
  }

  // Fail stale package purchases: pending older than cutoff
  try {
    const res = await db.update(packagePurchases)
      .set({
        paymentStatus: 'failed',
      })
      .where(and(
        eq(packagePurchases.paymentStatus, 'pending' as any),
        lt(packagePurchases.createdAt, cutoff as any),
      ));
    results.packagesFailed = (res as any)?.rowCount ?? undefined;
  } catch (e: any) {
    results.packagesError = e?.message || 'failed';
  }

  return NextResponse.json({ success: true, minutes, results });
}


