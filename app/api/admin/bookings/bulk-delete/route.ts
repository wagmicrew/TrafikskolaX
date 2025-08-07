import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Ensure admin access
    await requireAuth('admin');

    const { bookingIds } = await request.json();

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Booking IDs array is required' },
        { status: 400 }
      );
    }

    // Delete the bookings
    const result = await db
      .delete(bookings)
      .where(inArray(bookings.id, bookingIds));

    return NextResponse.json({
      message: `Successfully deleted ${bookingIds.length} bookings`,
      deletedCount: bookingIds.length
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookings' },
      { status: 500 }
    );
  }
}
