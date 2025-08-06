import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { lessonTypes } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all active lesson types
    const types = await db
      .select({
        id: lessonTypes.id,
        name: lessonTypes.name,
        price: lessonTypes.price,
        description: lessonTypes.description,
        isActive: lessonTypes.isActive,
      })
      .from(lessonTypes)
      .where(eq(lessonTypes.isActive, true))
      .orderBy(asc(lessonTypes.name));

    return NextResponse.json({ 
      lessonTypes: types
    });
  } catch (error) {
    console.error('Error fetching lesson types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 