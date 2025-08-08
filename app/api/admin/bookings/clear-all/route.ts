import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, handledarSessions } from '@/lib/db/schema';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get confirmation from request body
    const body = await request.json();
    const { confirm } = body;

    if (!confirm || confirm !== 'true') {
      return NextResponse.json({ 
        error: 'Confirmation required. Set confirm: true in request body.' 
      }, { status: 400 });
    }

    // Clear all regular bookings
    const deletedRegularBookings = await db
      .delete(bookings)
      .returning({ id: bookings.id });

    // Clear all handledar bookings
    const deletedHandledarBookings = await db
      .delete(handledarBookings)
      .returning({ id: handledarBookings.id });

    // Reset participant counts in handledar sessions
    await db
      .update(handledarSessions)
      .set({ 
        currentParticipants: 0,
        updatedAt: new Date()
      });

    const totalDeleted = deletedRegularBookings.length + deletedHandledarBookings.length;

    console.log(`Cleared all bookings: ${deletedRegularBookings.length} regular bookings, ${deletedHandledarBookings.length} handledar bookings`);

    return NextResponse.json({ 
      success: true,
      message: `All bookings cleared successfully`,
      deletedRegularBookings: deletedRegularBookings.length,
      deletedHandledarBookings: deletedHandledarBookings.length,
      totalDeleted,
      clearedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing all bookings:', error);
    return NextResponse.json({ 
      error: 'Failed to clear all bookings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
