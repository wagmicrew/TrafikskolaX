import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

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

    // Find user by email using raw SQL to avoid schema mapping issues
    const result = await db.execute(sql`
      SELECT id, email, password, first_name, last_name, role, is_active
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ogiltiga inloggningsuppgifter' },
        { status: 401 }
      );
    }

    const user = result.rows[0] as any;

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Kontot är inaktiverat' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password as string);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Ogiltiga inloggningsuppgifter' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id as string,
      email: user.email as string,
      role: user.role as 'student' | 'teacher' | 'admin',
      firstName: user.first_name as string,
      lastName: user.last_name as string,
    });

    // Determine redirect URL based on role
    let redirectUrl = '/dashboard';
    switch (user.role as string) {
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
        userId: user.id as string,
        email: user.email as string,
        role: user.role as string,
        firstName: user.first_name as string,
        lastName: user.last_name as string,
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
