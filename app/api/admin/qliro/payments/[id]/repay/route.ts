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
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    console.log('Admin repay request for purchase ID:', id);

    // Load purchase
    const purchaseRows = await db
      .select()
      .from(packagePurchases)
      .where(eq(packagePurchases.id, id))
      .limit(1);

    if (purchaseRows.length === 0) {
      console.log('Purchase not found for ID:', id);
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }
    const purchase = purchaseRows[0] as any;
    console.log('Found purchase:', { id: purchase.id, paymentMethod: purchase.paymentMethod, status: purchase.paymentStatus });

    if (purchase.paymentMethod !== 'qliro') {
      return NextResponse.json({ error: 'Not a Qliro payment' }, { status: 400 });
    }

    // Ensure Qliro is enabled
    let enabled;
    try {
      enabled = await qliroService.isEnabled();
    } catch (enabledError) {
      console.error('Error checking if Qliro is enabled:', enabledError);
      return NextResponse.json({ error: 'Failed to check Qliro availability' }, { status: 500 });
    }
    
    if (!enabled) {
      return NextResponse.json({ error: 'Qliro payment is not available' }, { status: 503 });
    }

    // Load user and package for context
    const [userRows, pkgRows] = await Promise.all([
      purchase.userId ? db.select().from(users).where(eq(users.id, purchase.userId)).limit(1) : Promise.resolve([]),
      purchase.packageId ? db
        .select()
        .from(packages)
        .where(and(eq(packages.id, purchase.packageId), eq(packages.isActive, true)))
        .limit(1) : Promise.resolve([]),
    ]);

    const targetUser = userRows[0] as any | undefined;
    const pkg = pkgRows[0] as any | undefined;

    // Determine amount: prefer existing pricePaid; fallback to package pricing
    const toNumber = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
    let amount = toNumber(purchase.pricePaid);
    if (!amount && pkg) {
      amount = toNumber(pkg.salePrice ?? pkg.priceStudent ?? pkg.price);
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount for purchase' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';

    // Create a new Qliro checkout for this purchase reference
    let checkout;
    try {
      checkout = await qliroService.createCheckout({
        amount,
        reference: purchase.id,
        description: (pkg?.name as string) || `Paketköp ${purchase.id}`,
        returnUrl: `${baseUrl}/dashboard/admin/settings/qliro?qliro_payment=${purchase.id}`,
        customerEmail: targetUser?.email || undefined,
        customerPhone: targetUser?.phone || undefined,
        customerFirstName: targetUser?.firstName || undefined,
        customerLastName: targetUser?.lastName || undefined,
      });
    } catch (checkoutError) {
      console.error('Qliro checkout creation failed:', checkoutError);
      const message = checkoutError instanceof Error ? checkoutError.message : 'Failed to create Qliro checkout';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      checkoutUrl: checkout.checkoutUrl,
      checkoutId: checkout.checkoutId,
      merchantReference: checkout.merchantReference,
    });
  } catch (error) {
    console.error('Admin repay Qliro payment error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create repayment link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
