import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases, users } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Handledar bookings: unpaid/pending
    const handledarRows = await db
      .select({
        id: handledarBookings.id,
        supervisorName: handledarBookings.supervisorName,
        supervisorEmail: handledarBookings.supervisorEmail,
        supervisorPhone: handledarBookings.supervisorPhone,
        amount: handledarBookings.price,
        status: handledarBookings.status,
        paymentStatus: handledarBookings.paymentStatus,
        createdAt: handledarBookings.createdAt,
      })
      .from(handledarBookings)
      .where(or(eq(handledarBookings.paymentStatus, 'pending' as 'pending'), eq(handledarBookings.paymentStatus, 'unpaid' as 'unpaid')));

    // Lesson bookings: unpaid/pending
    const bookingRows = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        amount: bookings.totalPrice,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(or(eq(bookings.paymentStatus, 'pending' as 'pending'), eq(bookings.paymentStatus, 'unpaid' as 'unpaid')));

    const userIds = bookingRows.map(b => b.userId).filter(Boolean) as string[];
    const usersMap: Record<string, { firstName: string | null; lastName: string | null; email: string | null; phone: string | null }> = {};
    if (userIds.length) {
      const usersRows = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, phone: users.phone })
        .from(users)
        .where(or(...userIds.map(id => eq(users.id, id))));
      for (const u of usersRows) usersMap[u.id] = { firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone };
    }

    // Package purchases: pending/unpaid
    const purchaseRows = await db
      .select({ id: packagePurchases.id, userId: packagePurchases.userId, amount: packagePurchases.pricePaid, paymentStatus: packagePurchases.paymentStatus, createdAt: packagePurchases.createdAt })
      .from(packagePurchases)
      .where(or(eq(packagePurchases.paymentStatus, 'pending' as 'pending'), eq(packagePurchases.paymentStatus, 'unpaid' as 'unpaid')));

    const purchaseUserIds = purchaseRows.map(p => p.userId);
    if (purchaseUserIds.length) {
      const moreUsers = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, phone: users.phone })
        .from(users)
        .where(or(...purchaseUserIds.map(id => eq(users.id, id))));
      for (const u of moreUsers) usersMap[u.id] = { firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone };
    }

    const items = [
      ...handledarRows.map(r => ({
        id: r.id,
        type: 'handledar' as const,
        name: r.supervisorName || 'Handledar-deltagare',
        email: r.supervisorEmail || undefined,
        phone: r.supervisorPhone || undefined,
        amount: Number(r.amount || 0),
        status: (r.paymentStatus as string) || 'pending',
        createdAt: r.createdAt as Date,
      })),
      ...bookingRows.map(r => {
        const u = r.userId ? usersMap[r.userId] : undefined;
        return {
          id: r.id,
          type: 'booking' as const,
          name: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'Bokning') : 'Bokning',
          email: u?.email || undefined,
          phone: u?.phone || undefined,
          amount: Number(r.amount || 0),
          status: (r.paymentStatus as string) || 'pending',
          createdAt: r.createdAt as Date,
        };
      }),
      ...purchaseRows.map(r => {
        const u = usersMap[r.userId];
        return {
          id: r.id,
          type: 'order' as const,
          name: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'Paketköp') : 'Paketköp',
          email: u?.email || undefined,
          phone: u?.phone || undefined,
          amount: Number(r.amount || 0),
          status: (r.paymentStatus as string) || 'pending',
          createdAt: r.createdAt as Date,
        };
      }),
    ];

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}


