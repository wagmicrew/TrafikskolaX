import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalMessages, users, siteSettings } from '@/lib/db/schema';
import { eq as drEq } from 'drizzle-orm';
import { eq, or, and, desc } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user.id;

    // Globally disable internal messages when setting is off
    try {
      const rows = await db
        .select()
        .from(siteSettings)
        .where(drEq(siteSettings.key, 'internal_messages_enabled'))
        .limit(1);
      const enabled = rows.length === 0 ? true : rows[0].value !== 'false';
      if (!enabled) {
        return NextResponse.json({ messages: [], disabled: true });
      }
    } catch {}

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'sent', 'received', 'unread'

    let whereCondition;
    
    switch (type) {
      case 'sent':
        whereCondition = eq(internalMessages.fromUserId, userId);
        break;
      case 'received':
        whereCondition = eq(internalMessages.toUserId, userId);
        break;
      case 'unread':
        whereCondition = and(
          eq(internalMessages.toUserId, userId),
          eq(internalMessages.isRead, false)
        );
        break;
      default:
        whereCondition = or(
          eq(internalMessages.fromUserId, userId),
          eq(internalMessages.toUserId, userId)
        );
    }

    const messages = await db
      .select({
        id: internalMessages.id,
        subject: internalMessages.subject,
        message: internalMessages.message,
        isRead: internalMessages.isRead,
        createdAt: internalMessages.createdAt,
        senderId: internalMessages.fromUserId,
        recipientId: internalMessages.toUserId,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderEmail: users.email,
      })
      .from(internalMessages)
      .leftJoin(users, eq(internalMessages.fromUserId, users.id))
      .where(whereCondition)
      .orderBy(desc(internalMessages.createdAt));

    // Transform messages to match frontend expectations
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      subject: msg.subject,
      message: msg.message,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      fromUserId: msg.senderId,
      toUserId: msg.recipientId,
      senderFirstName: msg.senderFirstName,
      senderLastName: msg.senderLastName,
      senderEmail: msg.senderEmail,
    }));

    return NextResponse.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user.id;

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
        fromUserId: userId,
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
