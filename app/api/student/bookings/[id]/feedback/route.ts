import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback, bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: bookingId } = await params;

    // First verify that this booking belongs to the requesting user
    const bookingCheck = await db
      .select({ userId: bookings.userId })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (bookingCheck.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (bookingCheck[0].userId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 404 });
    }

    // Fetch all feedback for the specific booking (both from student and teacher)
    const feedback = await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.bookingId, bookingId));

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching student feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
