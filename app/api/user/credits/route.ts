import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { userCredits, users, lessonTypes, handledarSessions } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lessonTypeId = searchParams.get('lessonTypeId');
    const handledarSessionId = searchParams.get('handledarSessionId');
    const creditType = searchParams.get('creditType'); // 'lesson' or 'handledar'

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
      // Handle special case for grouped handledar sessions
      if (lessonTypeId === 'handledarutbildning-group') {
        // Return 0 credits for the grouped session since it's not a real lesson type
        // The user should select a specific session to see their credits
        return NextResponse.json({ credits: 0, requireSessionSelection: true });
      }

      // Fetch user credits for a specific lesson type
      const credits = await db
        .select({
          creditsRemaining: userCredits.creditsRemaining,
        })
        .from(userCredits)
        .where(
          and(
            eq(userCredits.userId, payload.userId || payload.id),
            eq(userCredits.lessonTypeId, lessonTypeId),
            eq(userCredits.creditType, 'lesson')
          )
        );

      const totalCredits = credits ? credits.reduce((sum, credit) => sum + credit.creditsRemaining, 0) : 0;
      return NextResponse.json({ credits: totalCredits });
    } else if (handledarSessionId) {
      // Fetch user credits for a specific handledar session
      const credits = await db
        .select({
          creditsRemaining: userCredits.creditsRemaining,
        })
        .from(userCredits)
        .where(
          and(
            eq(userCredits.userId, payload.userId || payload.id),
            eq(userCredits.handledarSessionId, handledarSessionId),
            eq(userCredits.creditType, 'handledar')
          )
        );

      const totalCredits = credits ? credits.reduce((sum, credit) => sum + credit.creditsRemaining, 0) : 0;
      return NextResponse.json({ credits: totalCredits });
    } else if (creditType) {
      // Fetch all credits by type
      const baseQuery = db
        .select({
          id: userCredits.id,
          userId: userCredits.userId,
          lessonTypeId: userCredits.lessonTypeId,
          handledarSessionId: userCredits.handledarSessionId,
          creditType: userCredits.creditType,
          creditsRemaining: userCredits.creditsRemaining,
          creditsTotal: userCredits.creditsTotal,
          createdAt: userCredits.createdAt,
          updatedAt: userCredits.updatedAt,
        })
        .from(userCredits)
        .where(
          and(
            eq(userCredits.userId, payload.userId || payload.id),
            eq(userCredits.creditType, creditType)
          )
        );

      if (creditType === 'lesson') {
        const credits = await baseQuery
          .leftJoin(lessonTypes, eq(userCredits.lessonTypeId, lessonTypes.id))
          .select({
            id: userCredits.id,
            userId: userCredits.userId,
            lessonTypeId: userCredits.lessonTypeId,
            lessonTypeName: lessonTypes.name,
            creditType: userCredits.creditType,
            creditsRemaining: userCredits.creditsRemaining,
            creditsTotal: userCredits.creditsTotal,
            createdAt: userCredits.createdAt,
            updatedAt: userCredits.updatedAt,
          });
        return NextResponse.json({ credits, total: credits.length });
      } else if (creditType === 'handledar') {
        const credits = await baseQuery
          .leftJoin(handledarSessions, eq(userCredits.handledarSessionId, handledarSessions.id))
          .select({
            id: userCredits.id,
            userId: userCredits.userId,
            handledarSessionId: userCredits.handledarSessionId,
            handledarSessionTitle: handledarSessions.title,
            creditType: userCredits.creditType,
            creditsRemaining: userCredits.creditsRemaining,
            creditsTotal: userCredits.creditsTotal,
            createdAt: userCredits.createdAt,
            updatedAt: userCredits.updatedAt,
          });
        return NextResponse.json({ credits, total: credits.length });
      }
    } else {
      // Fetch all user credits with lesson type and handledar session details
      const allCredits = await db
        .select({
          id: userCredits.id,
          userId: userCredits.userId,
          lessonTypeId: userCredits.lessonTypeId,
          handledarSessionId: userCredits.handledarSessionId,
          lessonTypeName: lessonTypes.name,
          handledarSessionTitle: handledarSessions.title,
          creditType: userCredits.creditType,
          creditsRemaining: userCredits.creditsRemaining,
          creditsTotal: userCredits.creditsTotal,
          createdAt: userCredits.createdAt,
          updatedAt: userCredits.updatedAt,
        })
        .from(userCredits)
        .leftJoin(lessonTypes, eq(userCredits.lessonTypeId, lessonTypes.id))
        .leftJoin(handledarSessions, eq(userCredits.handledarSessionId, handledarSessions.id))
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
