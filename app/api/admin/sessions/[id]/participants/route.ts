import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sessionBookings } from '@/lib/db/schema/session-bookings';
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
        id: sessionBookings.id,
        sessionId: sessionBookings.sessionId,
        studentId: sessionBookings.studentId,
        supervisorName: sessionBookings.supervisorName,
        supervisorEmail: sessionBookings.supervisorEmail,
        supervisorPhone: sessionBookings.supervisorPhone,
        supervisorCount: sessionBookings.supervisorCount,
        status: sessionBookings.status,
        price: sessionBookings.price,
        paymentStatus: sessionBookings.paymentStatus,
        createdAt: sessionBookings.createdAt,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          role: users.role,
        }
      })
      .from(sessionBookings)
      .leftJoin(users, eq(sessionBookings.studentId, users.id))
      .where(eq(sessionBookings.sessionId, id))
      .orderBy(desc(sessionBookings.createdAt));

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}
