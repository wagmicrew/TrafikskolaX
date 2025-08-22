import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sql, eq } from 'drizzle-orm';
import { rateLimit, getRequestIp } from '@/lib/utils/rate-limit';
import { createAuthResponse } from '@/lib/auth/cookies';
import { signToken, type JWTPayload } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api/types';

async function handleLogin(request: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const ip = getRequestIp(request.headers as any);
  const rl = rateLimit({ key: `login:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many login attempts, try again shortly.'
      ),
      { status: 429 }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.VALIDATION_ERROR,
        `${firstError.path.join('.')}: ${firstError.message}`
      ),
      { status: 400 }
    );
  }

  const { email, password } = validation.data;

  // Find user by email using Drizzle ORM
  const { users } = await import('@/lib/db/schema');

  let user: any;

  try {
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      password: users.password,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.UNAUTHORIZED,
          'Ogiltiga inloggningsuppgifter'
        ),
        { status: 401 }
      );
    }

    user = userResult[0];

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.FORBIDDEN,
          'Kontot är inaktiverat'
        ),
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password as string);
    if (!isValidPassword) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.UNAUTHORIZED,
          'Ogiltiga inloggningsuppgifter'
        ),
        { status: 401 }
      );
    }
  } catch (dbError) {
    console.error('Database error:', dbError);
    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.INTERNAL_ERROR,
        'Database error occurred'
      ),
      { status: 500 }
    );
  }

  // Create user payload
  const userPayload: JWTPayload = {
    userId: user.id as string,
    email: user.email as string,
    role: user.role as 'student' | 'teacher' | 'admin',
    firstName: user.firstName as string,
    lastName: user.lastName as string,
  };

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

  // Create JWT payload
  const jwtPayload: JWTPayload = {
    userId: user.id as string,
    email: user.email as string,
    role: user.role as 'student' | 'teacher' | 'admin',
    firstName: user.firstName as string,
    lastName: user.lastName as string,
  };

  // Create auth response with JWT token in secure cookie
  const authResponse = createAuthResponse(jwtPayload, {
    redirectUrl,
    user: {
      userId: user.id as string,
      email: user.email as string,
      role: user.role as string,
      firstName: user.firstName as string,
      lastName: user.lastName as string,
    },
  });

  return authResponse;
}

// Export the handler directly
export const POST = handleLogin;
