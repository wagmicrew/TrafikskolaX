import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalMessages } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    const userId = payload.userId;

    // Fetch messages for the user
    const messages = await db
      .select()
      .from(internalMessages)
      .where(eq(internalMessages.userId, userId))
      .orderBy(desc(internalMessages.createdAt));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching internal messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify user authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    const userId = payload.userId;

    const { messageId } = await request.json();

    // Mark message as read
    await db
      .update(internalMessages)
      .set({ isRead: true })
      .where(eq(internalMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  }
}
