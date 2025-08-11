import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);

    const offset = (page - 1) * pageSize;

    const items = await db
      .select({
        id: bookings.id,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalPrice: bookings.totalPrice,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        status: bookings.status,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        lessonTypeName: lessonTypes.name,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(
        and(
          eq(bookings.paymentStatus, 'unpaid'),
          isNull(bookings.deletedAt)
        )
      )
      .orderBy(bookings.scheduledDate, bookings.startTime)
      .limit(pageSize)
      .offset(offset);

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.paymentStatus, 'unpaid'),
          isNull(bookings.deletedAt)
        )
      )
      .then((r) => Number(r[0].count));

    return NextResponse.json({ page, pageSize, total: totalCount, items });
  } catch (error) {
    console.error('Error fetching unpaid bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch unpaid bookings' }, { status: 500 });
  }
}




