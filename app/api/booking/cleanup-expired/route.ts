import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, handledarBookings, handledarSessions } from '@/lib/db/schema';
import { eq, and, sql, lt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization - this should be called by a cron job or internal service
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secure-cron-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up temporary/cancelled bookings older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Clean up expired temporary regular bookings
    // Permanently delete expired temps and stale cancelled
    const expiredRegularBookings = await db.execute(sql`
      DELETE FROM bookings
      WHERE (status = 'temp' AND created_at < ${fifteenMinutesAgo})
         OR (status = 'cancelled' AND updated_at < ${fifteenMinutesAgo})
      RETURNING id
    `);

    // Clean up expired pending handledar bookings
    const expiredHandledarBookings = await db
      .select()
      .from(handledarBookings)
      .where(
        and(
          eq(handledarBookings.status, 'pending'),
          lt(handledarBookings.createdAt, fifteenMinutesAgo)
        )
      );

    // For each expired handledar booking, decrease participant count and delete
    for (const booking of expiredHandledarBookings) {
      try {
        // Decrease participant count in session
        await db
          .update(handledarSessions)
          .set({ 
            currentParticipants: sql`GREATEST(${handledarSessions.currentParticipants} - 1, 0)`,
            updatedAt: new Date()
          })
          .where(eq(handledarSessions.id, booking.sessionId));

        // Delete the booking
        await db
          .delete(handledarBookings)
          .where(eq(handledarBookings.id, booking.id));
      } catch (error) {
        console.error(`Error cleaning up handledar booking ${booking.id}:`, error);
      }
    }

    const regularDeleted = ((expiredRegularBookings as any)?.rows?.length ?? 0) as number;
    const handledarDeleted = expiredHandledarBookings.length;
    const totalCleaned = regularDeleted + handledarDeleted;

    console.log(`Cleaned up ${totalCleaned} expired bookings (${regularDeleted} regular, ${handledarDeleted} handledar)`);

    return NextResponse.json({ 
      success: true,
      message: `Cleaned up ${totalCleaned} expired bookings`,
      regularBookings: regularDeleted,
      handledarBookings: handledarDeleted,
      cleanupTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in scheduled cleanup:', error);
    return NextResponse.json({ 
      error: 'Failed to perform scheduled cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests for manual testing
export async function GET(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secure-cron-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stats about temporary bookings
    const tempBookingsCount = await db
      .select({ count: sql`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'temp'));

    const pendingHandledarCount = await db
      .select({ count: sql`count(*)` })
      .from(handledarBookings)
      .where(eq(handledarBookings.status, 'pending'));

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const expiredTempCount = await db
      .select({ count: sql`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'temp'),
          lt(bookings.createdAt, fifteenMinutesAgo)
        )
      );

    const expiredHandledarCount = await db
      .select({ count: sql`count(*)` })
      .from(handledarBookings)
      .where(
        and(
          eq(handledarBookings.status, 'pending'),
          lt(handledarBookings.createdAt, fifteenMinutesAgo)
        )
      );

    return NextResponse.json({
      currentTime: new Date().toISOString(),
      stats: {
        totalTempBookings: Number(tempBookingsCount[0]?.count || 0),
        totalPendingHandledar: Number(pendingHandledarCount[0]?.count || 0),
        expiredTempBookings: Number(expiredTempCount[0]?.count || 0),
        expiredHandledarBookings: Number(expiredHandledarCount[0]?.count || 0)
      }
    });

  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return NextResponse.json({ 
      error: 'Failed to get cleanup stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
