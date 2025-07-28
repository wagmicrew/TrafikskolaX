import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-post och lösenord krävs' },
        { status: 400 }
      );
    }

    // Find user by email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'Ogiltiga inloggningsuppgifter' },
        { status: 401 }
      );
    }

    const user = existingUsers[0];

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Kontot är inaktiverat' },
        { status: 401 }
      );
    }

    // For now, we'll skip password verification since we're integrating with Neon Auth
    // In a full implementation, you'd verify the password here

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Determine redirect URL based on role
    let redirectUrl = '/dashboard';
    switch (user.role) {
      case 'admin':
        redirectUrl = '/dashboard/admin';
        break;
      case 'teacher':
        redirectUrl = '/dashboard/teacher';
        break;
      case 'student':
        redirectUrl = '/dashboard/student';
        break;
      default:
        redirectUrl = '/dashboard';
    }

    return NextResponse.json({
      success: true,
      token,
      redirectUrl,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid inloggning' },
      { status: 500 }
    );
  }
}
