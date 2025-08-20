import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    // Auth: require admin
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { feedbackId } = await params;
    const { feedbackText, valuation } = await request.json();

    // Update the feedback entry
    await db
      .update(userFeedback)
      .set({
        feedbackText,
        valuation
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
    // Auth: require admin
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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
