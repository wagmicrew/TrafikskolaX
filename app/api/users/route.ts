import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { or, eq, ne, not, like, and } from 'drizzle-orm';

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

    // Optional filters: role=student|teacher|admin, inskriven=true|false, excludeSelf=false
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const inskrivenParam = searchParams.get('inskriven') || searchParams.get('enrolledOnly');
    const excludeSelfParam = searchParams.get('excludeSelf');
    const inskrivenOnly = !!inskrivenParam && ['1', 'true', 'yes'].includes(inskrivenParam.toLowerCase());
    const excludeSelf = excludeSelfParam === 'false' ? false : true; // default true

    // Build base conditions
    const baseConds = [
      not(like(users.email, 'orderid-%@dintrafikskolahlm.se')), // exclude temporary users
      not(like(users.email, 'temp-%@%')), // exclude other temp patterns
      not(eq(users.firstName, 'Temporary')), // exclude users with temporary name
    ];
    if (excludeSelf && user.userId) {
      baseConds.push(ne(users.id, user.userId));
    }

    // Role scoping: students may only see teachers/admin regardless of filters
    if (user.role === 'student') {
      baseConds.push(or(eq(users.role, 'teacher'), eq(users.role, 'admin')));
    } else if (roleFilter) {
      // Admin/teacher can filter by role explicitly
      if (roleFilter === 'student' || roleFilter === 'teacher' || roleFilter === 'admin') {
        baseConds.push(eq(users.role, roleFilter as 'student' | 'teacher' | 'admin'));
      }
    }

    if (inskrivenOnly) {
      baseConds.push(eq(users.inskriven, true));
    }

    const availableUsers = await db
      .select()
      .from(users)
      .where(and(
        // spread all conditions; drizzle and() accepts varargs
        ...baseConds
      ));

    return NextResponse.json({ users: availableUsers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
