import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalMessages } from '@/lib/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Auth via centralized utility
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user.id;

    // Fetch messages for the user
    const messages = await db
      .select()
      .from(internalMessages)
      .where(
        or(
          eq(internalMessages.fromUserId, userId),
          eq(internalMessages.toUserId, userId)
        )
      )
      .orderBy(desc(internalMessages.createdAt));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching internal messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Auth via centralized utility
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user.id;

    const { messageId } = await request.json();

    // Mark message as read (only if it belongs to the user)
    await db
      .update(internalMessages)
      .set({ isRead: true })
      .where(and(eq(internalMessages.id, messageId), eq(internalMessages.toUserId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  }
}
