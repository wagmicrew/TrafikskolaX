import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalMessages, siteSettings } from '@/lib/db/schema';
import { eq as drEq } from 'drizzle-orm';
import { eq, and, count } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user.id;

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
          eq(internalMessages.toUserId, userId),
          eq(internalMessages.isRead, false)
        )
      );

    return NextResponse.json({ unreadCount: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
