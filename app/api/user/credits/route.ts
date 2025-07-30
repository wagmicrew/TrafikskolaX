import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { userCredits, users, lessonTypes } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lessonTypeId = searchParams.get('lessonTypeId');

    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (lessonTypeId) {
      // Fetch user credits for a specific lesson type
      const credits = await db
        .select({
          creditsRemaining: userCredits.creditsRemaining,
        })
        .from(userCredits)
        .where(
          and(
            eq(userCredits.userId, payload.userId || payload.id),
            eq(userCredits.lessonTypeId, lessonTypeId)
          )
        );

      const totalCredits = credits ? credits.reduce((sum, credit) => sum + credit.creditsRemaining, 0) : 0;
      return NextResponse.json({ credits: totalCredits });
    } else {
      // Fetch all user credits with lesson type details
      const allCredits = await db
        .select({
          id: userCredits.id,
          userId: userCredits.userId,
          lessonTypeId: userCredits.lessonTypeId,
          lessonTypeName: lessonTypes.name,
          creditsRemaining: userCredits.creditsRemaining,
          creditsTotal: userCredits.creditsTotal,
          createdAt: userCredits.createdAt,
          updatedAt: userCredits.updatedAt,
        })
        .from(userCredits)
        .leftJoin(lessonTypes, eq(userCredits.lessonTypeId, lessonTypes.id))
        .where(eq(userCredits.userId, payload.userId || payload.id));

      return NextResponse.json({ 
        credits: allCredits,
        total: allCredits.length 
      });
    }
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
