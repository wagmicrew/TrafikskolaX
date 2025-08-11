import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { bookings, slotSettings, blockedSlots, extraSlots } from '@/lib/db/schema';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// POST /api/admin/slots/reset
// Clears all bookings and slot-related tables, then seeds standard Mon–Fri timeslots
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Delete all existing data (safe-delete patterns to satisfy drizzle)
    await db.delete(bookings).where(eq(bookings.id, bookings.id));
    await db.delete(blockedSlots).where(eq(blockedSlots.id, blockedSlots.id));
    await db.delete(extraSlots).where(eq(extraSlots.id, extraSlots.id));
    await db.delete(slotSettings).where(eq(slotSettings.id, slotSettings.id));

    // Standard schedule (HH:MM)
    const schedule: Array<{ start: string; end: string }> = [
      { start: '08:15', end: '08:55' },
      { start: '09:05', end: '09:45' },
      { start: '09:55', end: '10:35' },
      { start: '10:55', end: '11:35' },
      { start: '11:45', end: '12:25' },
      { start: '13:10', end: '13:50' },
      { start: '14:00', end: '14:40' },
      { start: '14:50', end: '15:30' },
      { start: '15:45', end: '16:25' },
      { start: '16:35', end: '17:15' },
    ];

    // Days: Mon–Fri → 1..5
    const days = [1, 2, 3, 4, 5];

    const values = days.flatMap((day) =>
      schedule.map(({ start, end }) => ({
        dayOfWeek: day,
        timeStart: start,
        timeEnd: end,
        adminMinutes: 0,
        isActive: true,
      }))
    );

    const inserted = await db.insert(slotSettings).values(values).returning();

    return NextResponse.json({ message: 'Standardtider seedade', count: inserted.length });
  } catch (error) {
    console.error('Slots reset error:', error);
    return NextResponse.json({ error: 'Kunde inte återställa tidsluckor' }, { status: 500 });
  }
}


