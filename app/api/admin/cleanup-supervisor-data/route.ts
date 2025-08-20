import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { supervisorDetails, handledarBookings, handledarSessions } from '@/lib/db/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all handledar bookings that have passed their session date
    const expiredBookings = await db
      .select({
        bookingId: handledarBookings.id,
        sessionDate: handledarSessions.date,
        sessionTime: handledarSessions.startTime,
      })
      .from(handledarBookings)
      .innerJoin(handledarSessions, eq(handledarBookings.sessionId, handledarSessions.id))
      .where(
        and(
          lt(handledarSessions.date, today.toISOString().split('T')[0]), // Date has passed
          isNotNull(supervisorDetails.supervisorPersonalNumber) // Has personal number to clean
        )
      );

    if (expiredBookings.length === 0) {
      return NextResponse.json({
        message: 'No expired bookings with personal numbers found',
        cleanedCount: 0
      });
    }

    const bookingIds = expiredBookings.map(booking => booking.bookingId);
    let cleanedCount = 0;

    // Clean up personal numbers for expired bookings
    for (const bookingId of bookingIds) {
      const result = await db
        .update(supervisorDetails)
        .set({
          supervisorPersonalNumber: null // Set to null instead of deleting the record
        })
        .where(eq(supervisorDetails.handledarBookingId, bookingId))
        .returning();

      cleanedCount += result.length;
    }

    console.log(`[SUPERVISOR_CLEANUP] Cleaned ${cleanedCount} personal numbers from ${bookingIds.length} expired bookings`);

    return NextResponse.json({
      message: `Successfully cleaned ${cleanedCount} personal numbers from expired bookings`,
      cleanedCount,
      expiredBookingsCount: bookingIds.length,
      cleanedBookings: bookingIds
    });

  } catch (error) {
    console.error('Error cleaning up supervisor data:', error);
    return NextResponse.json({ 
      error: 'Failed to clean up supervisor data' 
    }, { status: 500 });
  }
}

// GET endpoint to check what would be cleaned (dry run)
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all handledar bookings that have passed their session date
    const expiredBookings = await db
      .select({
        bookingId: handledarBookings.id,
        sessionDate: handledarSessions.date,
        sessionTime: handledarSessions.startTime,
        supervisorName: supervisorDetails.supervisorName,
        hasPersonalNumber: isNotNull(supervisorDetails.supervisorPersonalNumber)
      })
      .from(handledarBookings)
      .innerJoin(handledarSessions, eq(handledarBookings.sessionId, handledarSessions.id))
      .leftJoin(supervisorDetails, eq(handledarBookings.id, supervisorDetails.handledarBookingId))
      .where(
        and(
          lt(handledarSessions.date, today.toISOString().split('T')[0]), // Date has passed
          isNotNull(supervisorDetails.supervisorPersonalNumber) // Has personal number to clean
        )
      );

    const uniqueBookings = new Map();
    expiredBookings.forEach(booking => {
      if (!uniqueBookings.has(booking.bookingId)) {
        uniqueBookings.set(booking.bookingId, {
          bookingId: booking.bookingId,
          sessionDate: booking.sessionDate,
          sessionTime: booking.sessionTime,
          supervisors: []
        });
      }
      if (booking.supervisorName) {
        uniqueBookings.get(booking.bookingId).supervisors.push({
          name: booking.supervisorName,
          hasPersonalNumber: booking.hasPersonalNumber
        });
      }
    });

    return NextResponse.json({
      message: 'Dry run - showing what would be cleaned',
      totalExpiredBookings: uniqueBookings.size,
      totalPersonalNumbersToClean: expiredBookings.filter(b => b.hasPersonalNumber).length,
      expiredBookings: Array.from(uniqueBookings.values())
    });

  } catch (error) {
    console.error('Error checking expired bookings:', error);
    return NextResponse.json({ 
      error: 'Failed to check expired bookings' 
    }, { status: 500 });
  }
}
