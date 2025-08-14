import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { packagePurchases, users, packages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { qliroService } from '@/lib/payment/qliro-service';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });

    const [purchase] = await db.select().from(packagePurchases).where(eq(packagePurchases.id, id)).limit(1);
    if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    if (purchase.paymentMethod !== 'qliro') return NextResponse.json({ error: 'Not a Qliro payment' }, { status: 400 });
    if (purchase.paymentStatus === 'paid') return NextResponse.json({ error: 'Order already paid' }, { status: 400 });

    // Load user/package for metadata
    const [userRow, pkgRow] = await Promise.all([
      purchase.userId ? db.select().from(users).where(eq(users.id, purchase.userId)).limit(1) : Promise.resolve([]),
      purchase.packageId ? db.select().from(packages).where(eq(packages.id, purchase.packageId)).limit(1) : Promise.resolve([]),
    ]);
    const user = userRow[0] as any | undefined;
    const pkg = pkgRow[0] as any | undefined;

    const toNumber = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
    let amount = toNumber(purchase.pricePaid);
    if (!amount && pkg) amount = toNumber((pkg as any).salePrice ?? (pkg as any).priceStudent ?? (pkg as any).price);
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount for purchase' }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const checkout = await qliroService.createCheckout({
      amount,
      reference: purchase.id,
      description: (pkg?.name as string) || `Paketköp ${purchase.id}`,
      returnUrl: `${baseUrl}/packages-store?openPayment=${purchase.id}`,
      customerEmail: user?.email || undefined,
      customerPhone: user?.phone || undefined,
      customerFirstName: user?.firstName || undefined,
      customerLastName: user?.lastName || undefined,
    });

    return NextResponse.json({ success: true, checkoutId: checkout.checkoutId, checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    console.error('Qliro create link error:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}


