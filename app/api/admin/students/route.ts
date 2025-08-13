import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, not, like } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeTemp = searchParams.get('excludeTemp') === 'true';
    // Default to including ALL students unless explicitly requested to filter
    const inskrivenOnly = (searchParams.get('inskrivenOnly') || 'false').toLowerCase() === 'true';

    // Auth using common helper; allow admin or teacher
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
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
              inskrivenOnly ? eq(users.inskriven, true) : eq(users.inskriven, users.inskriven),
              not(like(users.email, 'orderid-%@dintrafikskolahlm.se')),
              not(like(users.email, 'temp-%@%')),
              not(eq(users.firstName, 'Temporary'))
            )
          : and(
              eq(users.role, 'student'),
              inskrivenOnly ? eq(users.inskriven, true) : eq(users.inskriven, users.inskriven)
            )
      )
      .orderBy(users.firstName, users.lastName);

    const students = await baseSelect;

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
