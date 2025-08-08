import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extraSlots } from '@/lib/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.select().from(extraSlots);

    if (date) {
      query = query.where(eq(extraSlots.date, date));
    } else if (startDate && endDate) {
      query = query.where(
        and(
          gte(extraSlots.date, startDate),
          lte(extraSlots.date, endDate)
        )
      );
    }

    const extra = await query.orderBy(extraSlots.date, extraSlots.timeStart);

    return NextResponse.json({ extraSlots: extra });
  } catch (error) {
    console.error('Error fetching extra slots:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch extra slots',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { date, timeStart, timeEnd, reason } = body;

    if (!date || !timeStart || !timeEnd) {
      return NextResponse.json({ 
        error: 'Date, timeStart, and timeEnd are required' 
      }, { status: 400 });
    }

    // Check if there's already an extra slot for this date and time
    const existingExtra = await db
      .select()
      .from(extraSlots)
      .where(eq(extraSlots.date, date));

    const hasConflict = existingExtra.some(extra => {
      const extraStart = extra.timeStart;
      const extraEnd = extra.timeEnd;
      const newStart = timeStart;
      const newEnd = timeEnd;

      // Check for time overlap
      return (extraStart < newEnd && extraEnd > newStart);
    });

    if (hasConflict) {
      return NextResponse.json({ 
        error: 'Det finns redan en extra tidslucka för denna tid' 
      }, { status: 400 });
    }

    const newExtraSlot = await db
      .insert(extraSlots)
      .values({
        date,
        timeStart,
        timeEnd,
        reason,
        createdBy: authResult.user.userId,
      })
      .returning();

    return NextResponse.json({ 
      message: 'Extra tidslucka skapad framgångsrikt',
      extraSlot: newExtraSlot[0]
    });
  } catch (error) {
    console.error('Error creating extra slot:', error);
    return NextResponse.json({ 
      error: 'Failed to create extra slot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { id, date, timeStart, timeEnd, reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check for conflicts with other extra slots (excluding current one)
    const existingExtra = await db
      .select()
      .from(extraSlots)
      .where(eq(extraSlots.date, date));

    const hasConflict = existingExtra.some(extra => {
      if (extra.id === id) return false; // Skip current slot
      
      const extraStart = extra.timeStart;
      const extraEnd = extra.timeEnd;
      const newStart = timeStart;
      const newEnd = timeEnd;

      return (extraStart < newEnd && extraEnd > newStart);
    });

    if (hasConflict) {
      return NextResponse.json({ 
        error: 'Det finns redan en extra tidslucka för denna tid' 
      }, { status: 400 });
    }

    const updatedExtraSlot = await db
      .update(extraSlots)
      .set({
        date,
        timeStart,
        timeEnd,
        reason,
        updatedAt: new Date(),
      })
      .where(eq(extraSlots.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'Extra tidslucka uppdaterad framgångsrikt',
      extraSlot: updatedExtraSlot[0]
    });
  } catch (error) {
    console.error('Error updating extra slot:', error);
    return NextResponse.json({ 
      error: 'Failed to update extra slot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db
      .delete(extraSlots)
      .where(eq(extraSlots.id, id));

    return NextResponse.json({ 
      message: 'Extra tidslucka borttagen framgångsrikt' 
    });
  } catch (error) {
    console.error('Error deleting extra slot:', error);
    return NextResponse.json({ 
      error: 'Failed to delete extra slot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
