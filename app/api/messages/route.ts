import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db/client';
import { internalMessages, users } from '@/lib/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'sent', 'received', 'unread'

    let whereCondition;
    
    switch (type) {
      case 'sent':
        whereCondition = eq(internalMessages.fromUserId, user.userId || user.id);
        break;
      case 'received':
        whereCondition = eq(internalMessages.toUserId, user.userId || user.id);
        break;
      case 'unread':
        whereCondition = and(
          eq(internalMessages.toUserId, user.userId || user.id),
          eq(internalMessages.isRead, false)
        );
        break;
      default:
        whereCondition = or(
          eq(internalMessages.fromUserId, user.userId || user.id),
          eq(internalMessages.toUserId, user.userId || user.id)
        );
    }

    const messages = await db
      .select({
        id: internalMessages.id,
        subject: internalMessages.subject,
        message: internalMessages.message,
        isRead: internalMessages.isRead,
        createdAt: internalMessages.createdAt,
        fromUserId: internalMessages.fromUserId,
        toUserId: internalMessages.toUserId,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderEmail: users.email,
      })
      .from(internalMessages)
      .leftJoin(users, eq(internalMessages.fromUserId, users.id))
      .where(whereCondition)
      .orderBy(desc(internalMessages.createdAt));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { recipientId, subject, message } = await request.json();

    if (!recipientId || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify recipient exists
    const recipient = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, recipientId))
      .limit(1);

    if (recipient.length === 0) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const newMessage = await db
      .insert(internalMessages)
      .values({
        fromUserId: user.userId || user.id,
        toUserId: recipientId,
        subject,
        message,
        isRead: false,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: newMessage[0].id 
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
