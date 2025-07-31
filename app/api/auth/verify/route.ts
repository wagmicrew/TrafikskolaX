import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch complete user data from database to get profile image
    const dbUser = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
    
    if (dbUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Merge JWT data with database data, prioritizing database for profile image
    const completeUser = {
      ...user,
      profileImage: dbUser[0].profileImage,
    };

    return NextResponse.json({
      success: true,
      user: completeUser,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 500 }
    );
  }
}
