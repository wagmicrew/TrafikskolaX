import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Clear all authentication-related cookies
    const response = NextResponse.json({ success: true });
    
    // Clear JWT token
    response.cookies.delete('token');
    
    // Clear any other auth-related cookies
    response.cookies.delete('auth-token');
    response.cookies.delete('user-token');
    response.cookies.delete('session-token');
    
    // Clear user info cookies
    response.cookies.delete('user-info');
    response.cookies.delete('user-role');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests for logout (redirect-based logout)
  try {
    const cookieStore = cookies();
    
    // Clear all authentication-related cookies
    const response = NextResponse.redirect(new URL('/inloggning', request.url));
    
    // Clear JWT token
    response.cookies.delete('token');
    
    // Clear any other auth-related cookies
    response.cookies.delete('auth-token');
    response.cookies.delete('user-token');
    response.cookies.delete('session-token');
    
    // Clear user info cookies
    response.cookies.delete('user-info');
    response.cookies.delete('user-role');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/inloggning', request.url));
  }
}
