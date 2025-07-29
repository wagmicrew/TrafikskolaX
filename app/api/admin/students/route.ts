import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
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
    const students = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        inskriven: users.inskriven,
      })
      .from(users)
      .where(eq(users.role, 'student'))
      .orderBy(users.firstName, users.lastName);

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
