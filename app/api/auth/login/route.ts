import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';
import { rateLimit, getRequestIp } from '@/lib/utils/rate-limit';
import { withApiHandler, jsonSuccess, jsonError } from '@/lib/api/middleware';
import { createAuthResponse } from '@/lib/auth/cookies';
import { signToken, type JWTPayload } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api/types';

async function handleLogin(request: NextRequest) {
  // Rate limiting
  const ip = getRequestIp(request.headers as any);
  const rl = rateLimit({ key: `login:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return createErrorResponse(
      API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Too many login attempts, try again shortly.'
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const validation = loginSchema.safeParse(body);
  
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return createErrorResponse(
      API_ERROR_CODES.VALIDATION_ERROR,
      `${firstError.path.join('.')}: ${firstError.message}`
    );
  }
  
  const { email, password } = validation.data;

  // Find user by email
  const result = await db.execute(sql`
    SELECT id, email, password, first_name, last_name, role, is_active
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return createErrorResponse(
      API_ERROR_CODES.UNAUTHORIZED,
      'Ogiltiga inloggningsuppgifter'
    );
  }

  const user = result.rows[0] as any;

  // Check if user is active
  if (!user.is_active) {
    return createErrorResponse(
      API_ERROR_CODES.FORBIDDEN,
      'Kontot är inaktiverat'
    );
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password as string);
  if (!isValidPassword) {
    return createErrorResponse(
      API_ERROR_CODES.UNAUTHORIZED,
      'Ogiltiga inloggningsuppgifter'
    );
  }

  // Create user payload
  const userPayload: JWTPayload = {
    userId: user.id as string,
    email: user.email as string,
    role: user.role as 'student' | 'teacher' | 'admin',
    firstName: user.first_name as string,
    lastName: user.last_name as string,
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
    firstName: user.first_name as string,
    lastName: user.last_name as string,
  };

  // Create auth response with JWT token in secure cookie
  return createAuthResponse(jwtPayload, {
    redirectUrl,
    user: {
      userId: user.id as string,
      email: user.email as string,
      role: user.role as string,
      firstName: user.first_name as string,
      lastName: user.last_name as string,
    },
  });
}

// Use the new API handler wrapper
export const POST = withApiHandler(handleLogin, {
  validate: {
    body: loginSchema
  }
});
