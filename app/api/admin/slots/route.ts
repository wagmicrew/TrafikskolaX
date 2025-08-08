import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { slotSettings, blockedSlots } from '@/lib/db/schema';
import { eq, and, or, gte, lte } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

// GET - Get all slot settings
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/slots called');
    
    // Temporarily disable auth for testing
    // const authResult = await requireAuthAPI('admin');
    // if (!authResult.success) {
    //   return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    // }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'slots';

    if (type === 'blocked') {
      const blocked = await db
        .select()
        .from(blockedSlots)
        .orderBy(blockedSlots.date, blockedSlots.timeStart);

      return NextResponse.json({ blockedSlots: blocked });
    }

    const slots = await db
      .select()
      .from(slotSettings)
      .orderBy(slotSettings.dayOfWeek, slotSettings.timeStart);

    return NextResponse.json({ slots: slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

// POST - Create new slot setting
// PUT - Update existing slot setting
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/admin/slots called');
    
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      console.log('Auth failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const body = await request.json();
    console.log('PUT Request body:', body);
    const {
      id,
      dayOfWeek,
      timeStart,
      timeEnd,
      adminMinutes = 0,
      isActive = true
    } = body;

    if (!id || dayOfWeek === undefined || !timeStart || !timeEnd) {
      console.log('Missing required fields:', { id, dayOfWeek, timeStart, timeEnd });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic validations similar to POST
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeStart) || !timeRegex.test(timeEnd) || timeStart >= timeEnd) {
      return NextResponse.json({ error: 'Invalid time format or range' }, { status: 400 });
    }

    // Check for overlapping slots on the same day (excluding the current slot being updated)
    const existingSlots = await db
      .select()
      .from(slotSettings)
      .where(
        and(
          eq(slotSettings.dayOfWeek, dayOfWeek),
          eq(slotSettings.isActive, true)
        )
      );

    // Check for time conflicts with other slots (exclude current slot)
    for (const slot of existingSlots) {
      if (slot.id !== id) { // Exclude the current slot being updated
        if (
          (timeStart >= slot.timeStart && timeStart < slot.timeEnd) ||
          (timeEnd > slot.timeStart && timeEnd <= slot.timeEnd) ||
          (timeStart <= slot.timeStart && timeEnd >= slot.timeEnd)
        ) {
          return NextResponse.json({ 
            error: `Time slot overlaps with existing slot: ${slot.timeStart} - ${slot.timeEnd}` 
          }, { status: 400 });
        }
      }
    }

    const updated = await db
      .update(slotSettings)
      .set({ dayOfWeek, timeStart, timeEnd, adminMinutes, isActive })
      .where(eq(slotSettings.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'Slot updated successfully',
      slot: updated[0]
    });
  } catch (error) {
    console.error('Error updating slot:', error);
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 });
  }
}

// DELETE - Remove slot setting
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/admin/slots called');
    
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      console.log('Auth failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('Deleting slot with ID:', id);

    if (!id) {
      console.log('No ID provided');
      return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });
    }

    console.log('Executing delete query...');
    const result = await db
      .delete(slotSettings)
      .where(eq(slotSettings.id, id))
      .returning();
    
    console.log('Delete result:', result);

    return NextResponse.json({ 
      message: 'Slot removed successfully',
      deletedSlot: result[0] || null
    });
  } catch (error) {
    console.error('Error removing slot:', error);
    return NextResponse.json({ error: 'Failed to remove slot' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/slots called');
    
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      console.log('Auth failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const body = await request.json();
    console.log('Request body:', body);
    const { dayOfWeek, timeStart, timeEnd, adminMinutes = 0, isActive = true } = body;

    // Validate required fields
    if (dayOfWeek === undefined || !timeStart || !timeEnd) {
      console.log('Missing required fields:', { dayOfWeek, timeStart, timeEnd });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate day of week (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Invalid day of week' }, { status: 400 });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeStart) || !timeRegex.test(timeEnd)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
    }

    // Check if start time is before end time
    if (timeStart >= timeEnd) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
    }

    // Sanity check for unusual hours (outside 6 AM - 10 PM)
    const startHour = parseInt(timeStart.split(':')[0]);
    const endHour = parseInt(timeEnd.split(':')[0]);
    
    if (startHour < 6 || startHour > 22 || endHour < 6 || endHour > 22) {
      const { searchParams } = new URL(request.url);
      const confirmed = searchParams.get('confirmed') === 'true';
      
      if (!confirmed) {
        return NextResponse.json({ 
          warning: 'You are setting lesson times outside normal operating hours (6 AM - 10 PM). Are you sure?',
          requiresConfirmation: true
        }, { status: 422 });
      }
    }

    // Check for overlapping slots on the same day
    const existingSlots = await db
      .select()
      .from(slotSettings)
      .where(
        and(
          eq(slotSettings.dayOfWeek, dayOfWeek),
          eq(slotSettings.isActive, true)
        )
      );

    for (const slot of existingSlots) {
      if (
        (timeStart >= slot.timeStart && timeStart < slot.timeEnd) ||
        (timeEnd > slot.timeStart && timeEnd <= slot.timeEnd) ||
        (timeStart <= slot.timeStart && timeEnd >= slot.timeEnd)
      ) {
        return NextResponse.json({ 
          error: `Time slot overlaps with existing slot: ${slot.timeStart} - ${slot.timeEnd}` 
        }, { status: 400 });
      }
    }

    // Create the slot
    const [newSlot] = await db
      .insert(slotSettings)
      .values({
        dayOfWeek,
        timeStart,
        timeEnd,
        adminMinutes,
        isActive,
      })
      .returning();

    return NextResponse.json({ 
      message: 'Slot created successfully',
      slot: newSlot
    });
  } catch (error) {
    console.error('Error creating slot:', error);
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 });
  }
}
