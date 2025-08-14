import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, users, packages } from '@/lib/db/schema';
import { and, or, eq, like, gte, lte, desc, sql } from 'drizzle-orm';
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
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const paymentMethod = (searchParams.get('paymentMethod') || 'qliro').trim();
    const dateFieldParam = (searchParams.get('dateField') || 'purchase') as 'purchase' | 'paid';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Detect if the optional column paid_at exists in the database to avoid runtime errors on older schemas
    let paidAtExists = false;
    let userEmailExists = false;
    try {
      const result: any = await db.execute(sql`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'package_purchases' AND column_name = 'paid_at' LIMIT 1`);
      const rows = Array.isArray(result) ? result : (result?.rows ?? []);
      paidAtExists = rows.length > 0;
    } catch {
      paidAtExists = false;
    }
    try {
      const result2: any = await db.execute(sql`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'package_purchases' AND column_name = 'user_email' LIMIT 1`);
      const rows2 = Array.isArray(result2) ? result2 : (result2?.rows ?? []);
      userEmailExists = rows2.length > 0;
    } catch {
      userEmailExists = false;
    }

    const dateField = dateFieldParam === 'paid' && paidAtExists ? packagePurchases.paidAt : packagePurchases.purchaseDate;

    const conditions: any[] = [eq(packagePurchases.paymentMethod, paymentMethod)];

    if (status) {
      conditions.push(eq(packagePurchases.paymentStatus, status));
    }

    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        conditions.push(gte(dateField, fromDate));
      }
    }

    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        conditions.push(lte(dateField, toDate));
      }
    }

    if (search) {
      if (userEmailExists) {
        conditions.push(
          or(
            like(packagePurchases.id, `%${search}%`),
            like(packagePurchases.paymentReference, `%${search}%`),
            like(users.email, `%${search}%`),
            like(packagePurchases.userEmail, `%${search}%`)
          )
        );
      } else {
        conditions.push(
          or(
            like(packagePurchases.id, `%${search}%`),
            like(packagePurchases.paymentReference, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined as any;

    const offset = (page - 1) * pageSize;

    const items = await db
      .select({
        id: packagePurchases.id,
        userId: packagePurchases.userId,
        userEmail: userEmailExists ? packagePurchases.userEmail : users.email,
        packageId: packagePurchases.packageId,
        packageName: packages.name,
        pricePaid: packagePurchases.pricePaid,
        paymentMethod: packagePurchases.paymentMethod,
        paymentStatus: packagePurchases.paymentStatus,
        invoiceNumber: packagePurchases.invoiceNumber,
        purchaseDate: packagePurchases.purchaseDate,
        paidAt: paidAtExists ? packagePurchases.paidAt : sql`NULL`,
        paymentReference: packagePurchases.paymentReference,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(packagePurchases)
      .leftJoin(users, eq(users.id, packagePurchases.userId))
      .leftJoin(packages, eq(packages.id, packagePurchases.packageId))
      .where(whereClause)
      .orderBy(desc(dateField))
      .limit(pageSize)
      .offset(offset);

    // Compute total count (simple approach)
    const allMatching = await db
      .select({ id: packagePurchases.id })
      .from(packagePurchases)
      .leftJoin(users, eq(users.id, packagePurchases.userId))
      .leftJoin(packages, eq(packages.id, packagePurchases.packageId))
      .where(whereClause);

    const total = allMatching.length;

    return NextResponse.json({ page, pageSize, total, items });
  } catch (error) {
    console.error('Error listing Qliro payments:', error);
    return NextResponse.json({ error: 'Failed to list Qliro payments' }, { status: 500 });
  }
}
