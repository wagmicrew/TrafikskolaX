import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch unpaid bookings
    const unpaidBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, payload.userId),
          eq(bookings.paymentStatus, 'unpaid')
        )
      );

    return NextResponse.json({ count: unpaidBookings.length });
  } catch (error) {
    console.error('Error fetching unpaid bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch unpaid bookings' }, { status: 500 });
  }
}
