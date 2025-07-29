import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/inloggning', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // We'll verify the token in the dashboard pages themselves
    // This avoids Edge Runtime limitations
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
