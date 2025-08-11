import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { eq, and, not, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeTemp = searchParams.get('excludeTemp') === 'true';
    // Check if user is logged in and is admin or teacher
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all students
    const baseSelect = db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        inskriven: users.inskriven,
      })
      .from(users)
      .where(
        excludeTemp
          ? and(
              eq(users.role, 'student'),
              not(like(users.email, 'orderid-%@dintrafikskolahlm.se')),
              not(eq(users.firstName, 'Temporary'))
            )
          : eq(users.role, 'student')
      )
      .orderBy(users.firstName, users.lastName);

    const students = await baseSelect;

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
