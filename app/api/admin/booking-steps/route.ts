import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingSteps } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all booking steps
    const steps = await db
      .select()
      .from(bookingSteps)
      .orderBy(asc(bookingSteps.stepNumber), asc(bookingSteps.category));

    return NextResponse.json(steps);
  } catch (error) {
    console.error('Error fetching booking steps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
