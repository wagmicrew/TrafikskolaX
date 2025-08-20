import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slotSettings, blockedSlots } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const testQuery = await db.execute(`SELECT 1 as test`);
    console.log('Basic connection test:', testQuery);

    // Check if slot_settings table exists
    try {
      const slotsCount = await db.select().from(slotSettings).limit(1);
      console.log('Slots table accessible, sample count:', slotsCount.length);
    } catch (slotsError) {
      console.error('Error accessing slot_settings table:', slotsError);
      return NextResponse.json({ 
        error: 'Cannot access slot_settings table', 
        details: (slotsError as Error)?.message || 'Unknown error' 
      }, { status: 500 });
    }

    // Check if blocked_slots table exists  
    try {
      const blockedCount = await db.select().from(blockedSlots).limit(1);
      console.log('Blocked slots table accessible, sample count:', blockedCount.length);
    } catch (blockedError) {
      console.error('Error accessing blocked_slots table:', blockedError);
      return NextResponse.json({ 
        error: 'Cannot access blocked_slots table', 
        details: (blockedError as Error)?.message || 'Unknown error' 
      }, { status: 500 });
    }

    // Get actual data
    const slots = await db.select().from(slotSettings);
    const blocked = await db.select().from(blockedSlots);

    return NextResponse.json({
      message: 'Database connection successful',
      tables: {
        slot_settings: {
          exists: true,
          count: slots.length,
          data: slots
        },
        blocked_slots: {
          exists: true,
          count: blocked.length, 
          data: blocked
        }
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed', 
      details: (error as Error)?.message || 'Unknown error' 
    }, { status: 500 });
  }
}
