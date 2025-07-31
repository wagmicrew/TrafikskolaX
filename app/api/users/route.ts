import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { or, eq, ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch all users unless student
    const availableUsersQuery = user.role !== 'student'
      ? db.select().from(users).where(ne(users.id, user.userId)) // optionally exclude self
      : db
          .select()
          .from(users)
          .where(
            or(eq(users.role, 'teacher'), eq(users.role, 'admin'))
          );
    const availableUsers = await availableUsersQuery;

    return NextResponse.json({ users: availableUsers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
