import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriBookings } from '@/lib/db/schema/teori';
import { users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const participants = await db
      .select({
        id: teoriBookings.id,
        sessionId: teoriBookings.sessionId,
        studentId: teoriBookings.studentId,
        supervisorName: teoriBookings.participantName,
        supervisorEmail: teoriBookings.participantEmail,
        supervisorPhone: teoriBookings.participantPhone,
        supervisorCount: teoriBookings.id,
        status: teoriBookings.status,
        price: teoriBookings.price,
        paymentStatus: teoriBookings.paymentStatus,
        createdAt: teoriBookings.createdAt,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          role: users.role,
        }
      })
      .from(teoriBookings)
      .leftJoin(users, eq(teoriBookings.studentId, users.id))
      .where(eq(teoriBookings.sessionId, id))
      .orderBy(desc(teoriBookings.createdAt));

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}
