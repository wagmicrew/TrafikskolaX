import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userCredits, users } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lessonTypeId = searchParams.get('lessonTypeId');

    if (!lessonTypeId) {
      return NextResponse.json({ error: 'lessonTypeId is required' }, { status: 400 });
    }

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

    // Fetch user credits for this lesson type
    const credits = await db
      .select({
        availableCredits: userCredits.availableCredits,
      })
      .from(userCredits)
      .where(
        and(
          eq(userCredits.userId, payload.userId),
          eq(userCredits.lessonTypeId, lessonTypeId)
        )
      );

    const totalCredits = credits ? credits.reduce((sum, credit) => sum + credit.availableCredits, 0) : 0;

    return NextResponse.json({ credits: totalCredits });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
