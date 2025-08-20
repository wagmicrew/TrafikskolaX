/**
 * Secure HTTP-only cookie utilities for authentication tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { signToken, verifyToken, type JWTPayload } from './jwt';

export const AUTH_COOKIE_NAME = 'auth-token';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

/**
 * Creates secure cookie options for production
 */
function getSecureCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  };
}

/**
 * Sets an HTTP-only authentication cookie
 */
export function setAuthCookie(response: NextResponse, user: JWTPayload): NextResponse {
  const token = signToken(user);
  const cookieOptions = getSecureCookieOptions();
  
  response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
  
  return response;
}

/**
 * Clears the authentication cookie
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...getSecureCookieOptions(),
    maxAge: 0
  });
  
  return response;
}

/**
 * Gets user from HTTP-only cookie
 */
export function getUserFromCookie(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

/**
 * Creates a response with authentication cookie set
 */
export function createAuthResponse(user: JWTPayload, data?: any): NextResponse {
  const response = NextResponse.json({
    success: true,
    data: data || { user },
    message: 'Authentication successful'
  });
  
  return setAuthCookie(response, user);
}

/**
 * Creates a logout response with cookie cleared
 */
export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
  
  return clearAuthCookie(response);
}

/**
 * Middleware helper to check authentication from cookie
 */
export function requireAuth(request: NextRequest): JWTPayload | null {
  return getUserFromCookie(request);
}

/**
 * Legacy support: Get token from both cookie and header
 * @deprecated Use getUserFromCookie for secure cookie-only auth
 */
export function getTokenFromRequestLegacy(request: NextRequest): string | null {
  // First check cookies (preferred)
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fallback to Authorization header for API compatibility
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}
