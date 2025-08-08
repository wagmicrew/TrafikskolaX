import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, bookings } from '@/lib/db/schema';
import { sql, eq, and, not, like } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get total users (excluding temporary users)
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          not(like(users.email, 'orderid-%@dintrafikskolahlm.se')),
          not(like(users.email, 'temp-%@%')),
          not(eq(users.firstName, 'Temporary'))
        )
      );

    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Get total bookings
    const totalBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings);

    const totalBookings = Number(totalBookingsResult[0]?.count || 0);

    // Get pending bookings (temp status)
    const pendingBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'temp'));

    const pendingBookings = Number(pendingBookingsResult[0]?.count || 0);

    // Get completed bookings
    const completedBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.isCompleted, true));

    const completedBookings = Number(completedBookingsResult[0]?.count || 0);

    // Get total revenue (sum of all paid bookings)
    const totalRevenueResult = await db
      .select({ sum: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)` })
      .from(bookings)
      .where(eq(bookings.paymentStatus, 'paid'));

    const totalRevenue = Number(totalRevenueResult[0]?.sum || 0);

    // Get unread messages count (placeholder - you can implement this based on your messages schema)
    const unreadMessages = 0; // TODO: Implement when messages system is ready

    return NextResponse.json({
      totalUsers,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalRevenue,
      unreadMessages
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
