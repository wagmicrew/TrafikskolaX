import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { handledarBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI(); // allow both admin and teacher
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const rows = await db
      .select({
        id: handledarBookings.id,
        supervisorName: handledarBookings.supervisorName,
        supervisorEmail: handledarBookings.supervisorEmail,
        supervisorPhone: handledarBookings.supervisorPhone,
        studentId: handledarBookings.studentId,
        paymentStatus: handledarBookings.paymentStatus,
        status: handledarBookings.status,
        studentEmail: users.email,
      })
      .from(handledarBookings)
      .leftJoin(users, eq(handledarBookings.studentId, users.id))
      .where(eq(handledarBookings.sessionId, id));
    const participants = rows.filter(r => r.supervisorName !== 'Temporary');
    return NextResponse.json({ participants });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }
}



