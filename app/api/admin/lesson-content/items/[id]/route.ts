import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookingSteps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  const { id } = await params;
  try {
    const { title, description } = await request.json();
    const updated = await db.update(bookingSteps)
      .set({ subcategory: title, description })
      .where(eq(bookingSteps.id, Number(id)))
      .returning();
    return NextResponse.json({ success: true, item: updated[0] });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  const { id } = await params;
  try {
    await db.delete(bookingSteps).where(eq(bookingSteps.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}


