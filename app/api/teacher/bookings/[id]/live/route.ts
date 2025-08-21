import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { bookings, bookingPlanItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const [bk] = await db
      .select({ teacherId: bookings.teacherId, scheduledDate: bookings.scheduledDate, startTime: bookings.startTime, endTime: bookings.endTime, durationMinutes: bookings.durationMinutes, status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!bk) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (bk.teacherId !== ((user as any).userId || (user as any).id)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const steps = await db
      .select({ stepIdentifier: bookingPlanItems.stepIdentifier })
      .from(bookingPlanItems)
      .where(and(eq(bookingPlanItems.bookingId, bookingId), eq(bookingPlanItems.isSelected, true)));

    return NextResponse.json({
      booking: bk,
      steps: steps.map(s => s.stepIdentifier)
    });
  } catch (error) {
    console.error('Teacher live fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 });
  }
}




