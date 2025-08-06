import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { slotSettings } from '@/lib/db/schema';
import { and, eq, or, gte, lte } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/slots/copy called');
    
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      console.log('Auth failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { sourceDay = 1 } = body; // Default to Monday (1)
    const targetDays = [2, 3, 4, 5]; // Tuesday to Friday
    
    // Validate source day (0-6, where 0 is Sunday)
    if (sourceDay < 0 || sourceDay > 6) {
      return NextResponse.json({ error: 'Invalid source day' }, { status: 400 });
    }
    
    // Get all slots from the source day
    const sourceSlots = await db
      .select()
      .from(slotSettings)
      .where(and(
        eq(slotSettings.dayOfWeek, sourceDay),
        eq(slotSettings.isActive, true)
      ));
    
    if (sourceSlots.length === 0) {
      return NextResponse.json({ 
        message: 'No active slots found for the source day',
        sourceDay,
        sourceDayName: getDayName(sourceDay),
        slotsCopied: 0
      });
    }
    
    // For each target day, copy the slots
    let totalCopied = 0;
    const results = [];
    
    for (const targetDay of targetDays) {
      if (targetDay === sourceDay) continue; // Skip if same as source day
      
      // Check for existing slots on the target day
      const existingSlots = await db
        .select()
        .from(slotSettings)
        .where(eq(slotSettings.dayOfWeek, targetDay));
      
      // Skip if target day already has slots
      if (existingSlots.length > 0) {
        results.push({
          day: targetDay,
          dayName: getDayName(targetDay),
          status: 'skipped',
          reason: 'Day already has slots',
          existingSlots: existingSlots.length
        });
        continue;
      }
      
      // Prepare new slots for this target day
      const newSlots = sourceSlots.map(slot => ({
        dayOfWeek: targetDay,
        timeStart: slot.timeStart,
        timeEnd: slot.timeEnd,
        isActive: slot.isActive,
        adminMinutes: slot.adminMinutes,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      // Insert the new slots
      const inserted = await db
        .insert(slotSettings)
        .values(newSlots)
        .returning();
      
      totalCopied += inserted.length;
      results.push({
        day: targetDay,
        dayName: getDayName(targetDay),
        status: 'copied',
        slotsCopied: inserted.length
      });
    }
    
    return NextResponse.json({
      message: 'Slots copied successfully',
      sourceDay: {
        day: sourceDay,
        dayName: getDayName(sourceDay),
        slotsFound: sourceSlots.length
      },
      results,
      totalSlotsCopied: totalCopied
    });
    
  } catch (error) {
    console.error('Error copying slots:', error);
    return NextResponse.json(
      { error: 'Failed to copy slots', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get day name from day number (0-6)
function getDayName(dayNumber: number): string {
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];
  return days[dayNumber] || `Day ${dayNumber}`;
}
