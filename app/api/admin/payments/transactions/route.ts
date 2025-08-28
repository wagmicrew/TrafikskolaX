import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { invoices, bookings, users, lessonTypes } from '@/lib/db/schema';
import { eq, and, desc, sql, leftJoin } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const method = searchParams.get('method');
    const status = searchParams.get('status');

    // Build the base query with joins
    let query = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoice_number,
        customerName: invoices.customer_name,
        customerEmail: invoices.customer_email,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        paymentMethod: invoices.payment_method,
        createdAt: invoices.created_at,
        lessonTypeName: lessonTypes.name,
        scheduledDate: bookings.scheduledDate,
      })
      .from(invoices)
      .leftJoin(bookings, eq(invoices.booking_id, bookings.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .orderBy(desc(invoices.created_at))
      .limit(limit);

    // Apply filters if provided
    if (method && method !== 'all') {
      query = query.where(eq(invoices.payment_method, method));
    }

    if (status && status !== 'all') {
      query = query.where(eq(invoices.status, status));
    }

    const result = await query;

    // Transform the data to match our interface
    const transactions = result.map(row => ({
      id: row.id,
      invoiceNumber: row.invoiceNumber || 'N/A',
      customerName: row.customerName || 'Okänd kund',
      amount: Number(row.amount),
      method: (row.paymentMethod as 'swish' | 'qliro' | 'credit' | 'location') || 'unknown',
      status: (row.status as 'pending' | 'completed' | 'failed' | 'cancelled') || 'pending',
      createdAt: row.createdAt || new Date().toISOString(),
      lessonType: row.lessonTypeName,
      scheduledDate: row.scheduledDate,
    }));

    return NextResponse.json({
      transactions,
      total: transactions.length,
      hasMore: transactions.length === limit
    });
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment transactions' },
      { status: 500 }
    );
  }
}
