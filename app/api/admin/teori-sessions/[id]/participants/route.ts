import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI();
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const rows = await db
      .select({
        id: teoriBookings.id,
        sessionId: teoriBookings.sessionId,
        studentId: teoriBookings.studentId,
        supervisorName: teoriBookings.supervisorName,
        supervisorEmail: teoriBookings.supervisorEmail,
        supervisorPhone: teoriBookings.supervisorPhone,
        personalId: teoriBookings.personalId,
        createdAt: teoriBookings.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        studentEmail: users.email
      })
      .from(teoriBookings)
      .leftJoin(users, eq(teoriBookings.studentId, users.id))
      .where(eq(teoriBookings.sessionId, id));

    // Combine first and last name for full name
    const participants = rows.map(row => ({
      ...row,
      studentName: row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : 'N/A',
      studentEmail: row.studentEmail || 'N/A'
    }));

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error loading teori participants:', error);
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }
}
