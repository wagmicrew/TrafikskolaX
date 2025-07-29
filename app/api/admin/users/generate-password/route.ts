import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Ensure admin access
    await requireAuth('admin');

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate a random password
    const password = randomBytes(8).toString('hex');
    const hashedPassword = await hash(password, 10);

    // Update user with new password
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
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
      message: 'Password generated successfully',
      user: result[0],
      password: password // NOTE: In practice, you might want to email this to the user instead
    });
  } catch (error) {
    console.error('Password generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate password' },
      { status: 500 }
    );
  }
}
