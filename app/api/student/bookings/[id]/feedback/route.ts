import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
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

    // Fetch feedback for the specific booking
    // Students can only see feedback for their own bookings
    const feedback = await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.bookingId, bookingId));

    // Filter to only show feedback for this user (security check)
    const userFeedbackOnly = feedback.filter(fb => fb.userId === user.id);

    return NextResponse.json(userFeedbackOnly);
  } catch (error) {
    console.error('Error fetching student feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
