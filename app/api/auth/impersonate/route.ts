import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth || !auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const target = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (target.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const t = target[0];
    const token = signToken({
      userId: t.id,
      email: t.email,
      role: t.role as any,
      firstName: t.firstName,
      lastName: t.lastName,
    });

    const response = NextResponse.json({ success: true, token });
    // Preserve original admin token so we can restore later
    // Store it in a separate cookie 'admin-session-token'
    const adminCookie = request.cookies.get('auth-token')?.value;
    if (adminCookie) {
      response.cookies.set('admin-session-token', adminCookie, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    // Set the impersonated auth token as a client-readable cookie to keep client context in sync
    response.cookies.set('auth-token', token, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    });
    // Also return adminToken in body so client can keep a local backup
    if (adminCookie) {
      // Overwrite body to include adminToken
      return NextResponse.json({ success: true, token, adminToken: adminCookie }, {
        headers: response.headers,
        status: 200,
      });
    }
    return response;
  } catch (e) {
    console.error('Impersonate error:', e);
    return NextResponse.json({ error: 'Failed to impersonate user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Restore original admin session if present
    const adminToken = request.cookies.get('admin-session-token')?.value;
    const response = NextResponse.json({ success: true, token: adminToken ?? null });
    if (adminToken) {
      // Restore client-readable auth token
      response.cookies.set('auth-token', adminToken, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      });
      // Remove the admin-session-token cookie
      response.cookies.set('admin-session-token', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
      });
    }
    return response;
  } catch (e) {
    console.error('Restore session error:', e);
    return NextResponse.json({ error: 'Failed to restore session' }, { status: 500 });
  }
}


