import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { or, eq, and, not, like } from 'drizzle-orm';

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

    // Fetch appropriate users based on current user's role, excluding temporary users
    let recipientUsers;
    
    if (user.role === 'student') {
      // Students can only message teachers and admins
      recipientUsers = await db
        .select({
          id: users.id,
          name: users.firstName,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(
          and(
            or(
              eq(users.role, 'teacher'),
              eq(users.role, 'admin')
            ),
            not(like(users.email, 'orderid-%@dintrafikskolahlm.se')), // exclude temporary users
            not(like(users.email, 'temp-%@%')), // exclude other temp patterns
            not(eq(users.firstName, 'Temporary')) // exclude users with temporary name
          )
        );
    } else {
      // Teachers and admins can message everyone except temporary users
      recipientUsers = await db
        .select({
          id: users.id,
          name: users.firstName,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(
          and(
            not(like(users.email, 'orderid-%@dintrafikskolahlm.se')), // exclude temporary users
            not(like(users.email, 'temp-%@%')), // exclude other temp patterns
            not(eq(users.firstName, 'Temporary')) // exclude users with temporary name
          )
        );
    }

    return NextResponse.json({ teachers: recipientUsers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
