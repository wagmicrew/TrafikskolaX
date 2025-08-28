import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages, packagePurchases, invoices, invoiceItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;
    const { packageId } = await request.json();

    if (!packageId || typeof packageId !== 'string') {
      return NextResponse.json({ error: 'Valid package ID is required' }, { status: 400 });
    }

    // Fetch package details
    const packageData = await db
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.isActive, true)))
      .limit(1);

    if (!packageData.length) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const pkg = packageData[0];
    
    // Calculate effective price
    const toNumber = (v: unknown): number => typeof v === 'number' ? v : Number(v ?? 0);
    let effectivePrice: number = toNumber(pkg.price);
    if (pkg.salePrice !== null && pkg.salePrice !== undefined) {
      effectivePrice = toNumber(pkg.salePrice);
    } else if (user.role === 'student' && pkg.priceStudent !== null && pkg.priceStudent !== undefined) {
      effectivePrice = toNumber(pkg.priceStudent);
    }

    // Generate invoice number
    const invoiceNumber = `PKG-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Create invoice
    const invoice = await db
      .insert(invoices)
      .values({
        invoice_number: invoiceNumber,
        type: 'package',
        customer_name: `${user.firstName} ${user.lastName}`,
        customer_email: user.email,
        customer_phone: user.phone || '',
        description: `Lektionspaket: ${pkg.name}`,
        amount: effectivePrice,
        currency: 'SEK',
        status: 'pending',
        user_id: user.id,
        package_id: packageId,
        issued_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })
      .returning();

    const invoiceId = invoice[0].id;

    // Create invoice item
    await db
      .insert(invoiceItems)
      .values({
        invoice_id: invoiceId,
        description: `Lektionspaket: ${pkg.name}`,
        quantity: 1,
        unit_price: effectivePrice,
        total_price: effectivePrice,
        item_type: 'package',
        item_reference: packageId,
      });

    // Create package purchase record
    const purchase = await db
      .insert(packagePurchases)
      .values({
        userId: user.id,
        packageId: packageId,
        pricePaid: effectivePrice.toFixed(2),
        paymentMethod: 'pending',
        paymentStatus: 'pending',
        userEmail: user.email,
        invoiceId: invoiceId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      invoiceId: invoiceId,
      invoiceNumber: invoiceNumber,
      purchaseId: purchase[0].id,
      amount: effectivePrice,
      betalhubbenUrl: `/betalhubben/${invoiceId}`
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
