import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookingSteps } from '@/lib/db/schema';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  const { id } = await params;
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'name required' }, { status: 400 });
    // No-op; UI works against bookingSteps, so just echo
    return NextResponse.json({ success: true, group: { id, name, sortOrder: 0, isActive: true } });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  const { id } = await params;
  try {
    // No-op
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}


