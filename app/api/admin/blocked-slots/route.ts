import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blockedSlots } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

// GET - Get blocked slots
export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.select().from(blockedSlots);

    if (date) {
      query = query.where(eq(blockedSlots.date, date));
    } else if (startDate && endDate) {
      query = query.where(
        and(
          gte(blockedSlots.date, startDate),
          lte(blockedSlots.date, endDate)
        )
      );
    }

    const blocked = await query.orderBy(blockedSlots.date, blockedSlots.timeStart);

    return NextResponse.json({ blockedSlots: blocked });
  } catch (error) {
    console.error('Error fetching blocked slots:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked slots' }, { status: 500 });
  }
}

// POST - Create blocked slot
export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');
    
    const body = await request.json();
    const { date, timeStart, timeEnd, isAllDay = false, reason, createdBy } = body;

    // Validate required fields
    if (!date || (!isAllDay && (!timeStart || !timeEnd))) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Validate time format if not all day
    if (!isAllDay) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(timeStart) || !timeRegex.test(timeEnd)) {
        return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
      }

      if (timeStart >= timeEnd) {
        return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
      }
    }

    // Check for overlapping blocked slots
    const existing = await db
      .select()
      .from(blockedSlots)
      .where(eq(blockedSlots.date, date));

    for (const blocked of existing) {
      if (blocked.isAllDay || isAllDay) {
        return NextResponse.json({ 
          error: 'Conflicts with existing all-day block on this date' 
        }, { status: 400 });
      }

      if (!isAllDay && !blocked.isAllDay) {
        if (
          (timeStart >= blocked.timeStart && timeStart < blocked.timeEnd) ||
          (timeEnd > blocked.timeStart && timeEnd <= blocked.timeEnd) ||
          (timeStart <= blocked.timeStart && timeEnd >= blocked.timeEnd)
        ) {
          return NextResponse.json({ 
            error: `Time overlaps with existing blocked slot: ${blocked.timeStart} - ${blocked.timeEnd}` 
          }, { status: 400 });
        }
      }
    }

    // Create the blocked slot
    const [newBlocked] = await db
      .insert(blockedSlots)
      .values({
        date,
        timeStart: isAllDay ? null : timeStart,
        timeEnd: isAllDay ? null : timeEnd,
        isAllDay,
        reason,
        createdBy,
      })
      .returning();

    return NextResponse.json({ 
      message: 'Blocked slot created successfully',
      blockedSlot: newBlocked
    });
  } catch (error) {
    console.error('Error creating blocked slot:', error);
    return NextResponse.json({ error: 'Failed to create blocked slot' }, { status: 500 });
  }
}

// PUT - Update blocked slot
export async function PUT(request: NextRequest) {
  try {
    await requireAuth('admin');
    
    const body = await request.json();
    const { id, date, timeStart, timeEnd, isAllDay = false, reason } = body;

    if (!id || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Similar validations as POST
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (!isAllDay) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(timeStart) || !timeRegex.test(timeEnd) || timeStart >= timeEnd) {
        return NextResponse.json({ error: 'Invalid time format or range' }, { status: 400 });
      }
    }

    const updated = await db
      .update(blockedSlots)
      .set({
        date,
        timeStart: isAllDay ? null : timeStart,
        timeEnd: isAllDay ? null : timeEnd,
        isAllDay,
        reason,
        updatedAt: new Date(),
      })
      .where(eq(blockedSlots.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'Blocked slot updated successfully',
      blockedSlot: updated[0]
    });
  } catch (error) {
    console.error('Error updating blocked slot:', error);
    return NextResponse.json({ error: 'Failed to update blocked slot' }, { status: 500 });
  }
}

// DELETE - Remove blocked slot
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth('admin');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Blocked slot ID required' }, { status: 400 });
    }

    await db
      .delete(blockedSlots)
      .where(eq(blockedSlots.id, id));

    return NextResponse.json({ 
      message: 'Blocked slot removed successfully' 
    });
  } catch (error) {
    console.error('Error removing blocked slot:', error);
    return NextResponse.json({ error: 'Failed to remove blocked slot' }, { status: 500 });
  }
}
