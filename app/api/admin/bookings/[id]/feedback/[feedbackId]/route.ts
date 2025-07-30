import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { feedbackId } = await params;
    const { feedbackText, valuation } = await request.json();

    // Update the feedback entry
    await db
      .update(userFeedback)
      .set({
        feedbackText,
        valuation,
        updatedAt: new Date()
      })
      .where(eq(userFeedback.id, feedbackId));

    return NextResponse.json({ message: 'Feedback updated successfully' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { feedbackId } = await params;

    // Delete the feedback entry
    await db
      .delete(userFeedback)
      .where(eq(userFeedback.id, feedbackId));

    return NextResponse.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
