import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { invoices, qliroOrders, userCredits, bookings } from '@/lib/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

    // Get today's date at start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total revenue
    const totalRevenueResult = await db
      .select({ total: sql<number>`SUM(${invoices.amount})` })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    // Calculate today's revenue
    const todayRevenueResult = await db
      .select({ total: sql<number>`SUM(${invoices.amount})` })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'paid'),
        gte(invoices.paid_at, today)
      ));

    // Count pending payments
    const pendingPaymentsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(eq(invoices.status, 'pending'));

    // Count completed payments
    const completedPaymentsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    // Count transactions by method
    const swishTransactionsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(and(
        eq(invoices.payment_method, 'swish'),
        eq(invoices.status, 'paid')
      ));

    const qliroTransactionsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(qliroOrders)
      .where(eq(qliroOrders.status, 'completed'));

    // Count credit transactions (from bookings paid with credits)
    const creditTransactionsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bookings)
      .where(eq(bookings.paymentMethod, 'credits'));

    const stats = {
      totalRevenue: Number(totalRevenueResult[0]?.total || 0),
      todayRevenue: Number(todayRevenueResult[0]?.total || 0),
      pendingPayments: Number(pendingPaymentsResult[0]?.count || 0),
      completedPayments: Number(completedPaymentsResult[0]?.count || 0),
      swishTransactions: Number(swishTransactionsResult[0]?.count || 0),
      qliroTransactions: Number(qliroTransactionsResult[0]?.count || 0),
      creditTransactions: Number(creditTransactionsResult[0]?.count || 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}
