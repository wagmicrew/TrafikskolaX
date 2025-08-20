import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalMessages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user.id;

    const { id } = await params;
    const { isRead } = await request.json();

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
    }

    // Update message as read, but only if the user is the recipient
    const result = await db
      .update(internalMessages)
      .set({ isRead })
      .where(
        and(
          eq(internalMessages.id, id),
          eq(internalMessages.toUserId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message updated successfully' 
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.user.id;

    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
    }

    // Delete message if the user is either the sender or recipient
    const result = await db
      .delete(internalMessages)
      .where(
        and(
          eq(internalMessages.id, id),
          // Check if user is either sender or recipient
          eq(internalMessages.toUserId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      // Try deleting as sender if recipient delete failed
      const senderResult = await db
        .delete(internalMessages)
        .where(
          and(
            eq(internalMessages.id, id),
            eq(internalMessages.fromUserId, userId)
          )
        )
        .returning();
        
      if (senderResult.length === 0) {
        return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
