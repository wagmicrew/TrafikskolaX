import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { packagePurchases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // Ensure purchase exists and is a Qliro payment
    const rows = await db
      .select({
        id: packagePurchases.id,
        paymentMethod: packagePurchases.paymentMethod,
        paymentStatus: packagePurchases.paymentStatus,
      })
      .from(packagePurchases)
      .where(eq(packagePurchases.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const purchase = rows[0];

    if (purchase.paymentMethod !== 'qliro') {
      return NextResponse.json({ error: 'Not a Qliro payment' }, { status: 400 });
    }

    // Note: Actual Qliro refund API integration is pending confirmation.
    // This endpoint currently returns Not Implemented to surface in UI.
    return NextResponse.json({ success: false, message: 'Refund operation is not implemented yet for Qliro.' }, { status: 501 });
  } catch (error) {
    console.error('Qliro refund error:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
