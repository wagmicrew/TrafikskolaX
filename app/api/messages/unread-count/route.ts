import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { internalMessages, siteSettings } from '@/lib/db/schema';
import { eq as drEq } from 'drizzle-orm';
import { eq, and, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if internal messages are globally enabled
    try {
      const rows = await db
        .select()
        .from(siteSettings)
        .where(drEq(siteSettings.key, 'internal_messages_enabled'))
        .limit(1);
      const enabled = rows.length === 0 ? true : rows[0].value !== 'false';
      if (!enabled) {
        return NextResponse.json({ unreadCount: 0, disabled: true });
      }
    } catch {}

    const result = await db
      .select({ count: count() })
      .from(internalMessages)
      .where(
        and(
          eq(internalMessages.toUserId, user.userId || user.id),
          eq(internalMessages.isRead, false)
        )
      );

    return NextResponse.json({ unreadCount: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
