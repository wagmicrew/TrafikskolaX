import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Ensure admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user to set inskriven to true and set inskrivenDate
    const result = await db
      .update(users)
      .set({
        inskriven: true,
        inskrivenDate: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id, email: users.email });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User has been successfully enrolled (inskriven)',
      user: result[0],
    });
  } catch (error) {
    console.error('Skriv in error:', error);
    return NextResponse.json(
      { error: 'Failed to update user enrollment status' },
      { status: 500 }
    );
  }
}
