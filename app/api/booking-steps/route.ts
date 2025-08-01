import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { bookingSteps } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only teachers and admins can access booking steps
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const steps = await db
      .select()
      .from(bookingSteps)
      .orderBy(asc(bookingSteps.stepNumber), asc(bookingSteps.id));

    return NextResponse.json({ steps });
  } catch (error) {
    console.error('Error fetching booking steps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
