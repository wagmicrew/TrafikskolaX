import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // First check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then check cookies for browser requests
  const cookieToken = request.cookies.get('auth-token');
  return cookieToken?.value || null;
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    console.log('No token found in request');
    return null;
  }

  const user = verifyToken(token);
  if (!user) {
    console.log('Invalid token');
    return null;
  }

  return user;
}
