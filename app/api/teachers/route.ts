import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { or, eq } from 'drizzle-orm';

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

    // Fetch appropriate users based on current user's role
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
          or(
            eq(users.role, 'teacher'),
            eq(users.role, 'admin')
          )
        );
    } else {
      // Teachers and admins can message everyone
      recipientUsers = await db
        .select({
          id: users.id,
          name: users.firstName,
          email: users.email,
          role: users.role,
        })
        .from(users);
    }

    return NextResponse.json({ teachers: recipientUsers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
