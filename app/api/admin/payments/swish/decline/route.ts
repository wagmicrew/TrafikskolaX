import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const { id, type } = await request.json();
    if (!id || !type) return NextResponse.json({ error: 'id and type required' }, { status: 400 });

    if (type === 'handledar') {
      await db.update(handledarBookings).set({ paymentStatus: 'failed' as any, status: 'cancelled' as any, updatedAt: new Date() }).where(eq(handledarBookings.id, id));
    } else if (type === 'booking') {
      await db.update(bookings).set({ paymentStatus: 'failed' as any, status: 'cancelled' as any, updatedAt: new Date() }).where(eq(bookings.id, id));
    } else if (type === 'order') {
      await db.update(packagePurchases).set({ paymentStatus: 'failed' as any }).where(eq(packagePurchases.id, id));
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}


