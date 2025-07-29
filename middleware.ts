import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Get token from cookies or Authorization header
    let token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/inloggning', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const user = verifyToken(token);
    if (!user) {
      const loginUrl = new URL('/inloggning', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    if (pathname.startsWith('/dashboard/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/student', request.url));
    }
    
    if (pathname.startsWith('/dashboard/teacher') && user.role !== 'teacher') {
      return NextResponse.redirect(new URL('/dashboard/student', request.url));
    }
    
    if (pathname.startsWith('/dashboard/student') && user.role !== 'student') {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      } else if (user.role === 'teacher') {
        return NextResponse.redirect(new URL('/dashboard/teacher', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
