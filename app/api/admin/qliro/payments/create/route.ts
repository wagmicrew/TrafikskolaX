import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages, packagePurchases, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { qliroService } from '@/lib/payment/qliro-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, packageId } = await request.json();

    if (!userId || typeof userId !== 'string' || !packageId || typeof packageId !== 'string') {
      return NextResponse.json({ error: 'userId and packageId are required' }, { status: 400 });
    }

    // Validate user
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const targetUser = userRows[0];

    // Validate package
    const pkgRows = await db
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.isActive, true)))
      .limit(1);

    if (pkgRows.length === 0) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 });
    }
    const pkg = pkgRows[0];

    // Determine effective price
    const toNumber = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
    let amount = toNumber(pkg.price);
    if (pkg.salePrice !== null && pkg.salePrice !== undefined) {
      amount = toNumber(pkg.salePrice);
    } else if (targetUser.role === 'student' && pkg.priceStudent !== null && pkg.priceStudent !== undefined) {
      amount = toNumber(pkg.priceStudent);
    }

    // Ensure Qliro is enabled
    const enabled = await qliroService.isEnabled();
    if (!enabled) {
      return NextResponse.json({ error: 'Qliro payment is not available' }, { status: 503 });
    }

    // Create purchase row
    const inserted = await db
      .insert(packagePurchases)
      .values({
        userId: targetUser.id,
        packageId,
        pricePaid: amount.toFixed(2),
        paymentMethod: 'qliro',
        paymentStatus: 'pending',
        userEmail: targetUser.email,
      })
      .returning();

    const purchase = inserted[0];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';

    // Create a Qliro checkout
    const checkout = await qliroService.createCheckout({
      amount,
      reference: purchase.id,
      description: pkg?.name || `Paketköp ${purchase.id}`,
      returnUrl: `${baseUrl}/dashboard/admin/settings?qliro_payment=${purchase.id}`,
      customerEmail: targetUser.email || undefined,
      customerPhone: (targetUser as any)?.phone || undefined,
      customerFirstName: (targetUser as any)?.firstName || undefined,
      customerLastName: (targetUser as any)?.lastName || undefined,
    });

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      checkoutUrl: checkout.checkoutUrl,
      checkoutId: checkout.checkoutId,
      merchantReference: checkout.merchantReference,
    });
  } catch (error) {
    console.error('Admin create Qliro payment request error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
