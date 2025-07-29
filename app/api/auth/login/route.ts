import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Request headers:', request.headers);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
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
    // Cast to any to access snake_case properties from database
    const userAny = user as any;

    // Check if user is active
    if (!userAny.is_active) {
      return NextResponse.json(
        { error: 'Kontot är inaktiverat' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Ogiltiga inloggningsuppgifter' },
        { status: 401 }
      );
    }

    // Generate JWT token (use existing userAny variable)
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: userAny.first_name,
      lastName: userAny.last_name,
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

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      token,
      redirectUrl,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: userAny.first_name,
        lastName: userAny.last_name,
      },
    });

    // Set HTTP-only cookie for better security
    response.cookies.set('auth-token', token, {
      httpOnly: false, // Allow client-side access for now
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid inloggning' },
      { status: 500 }
    );
  }
}
