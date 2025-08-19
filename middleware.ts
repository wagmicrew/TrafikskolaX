import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;

  // Handle dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/inloggning', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If user is on login/register pages but has a token, redirect to appropriate dashboard
    // This prevents React Error #310 by avoiding unnecessary re-renders
    if (pathname === '/login' || pathname === '/register' || pathname === '/inloggning') {
      // We'll let the client-side auth handle the redirect to avoid Edge Runtime limitations
      return NextResponse.next();
    }
  }

  // Handle login/register pages - if user is already authenticated, redirect to appropriate dashboard
  if ((pathname === '/login' || pathname === '/register' || pathname === '/inloggning') && token) {
    // We'll let the client-side auth handle the redirect to avoid Edge Runtime limitations
    return NextResponse.next();
  }

  // Handle logout - clear cookies and redirect to home
  if (pathname === '/logout') {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register', 
    '/inloggning',
    '/logout'
  ]
};
