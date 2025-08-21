import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, packages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch paid/active package purchases for the user with package details
    const results = await db
      .select({
        id: packagePurchases.id,
        packageId: packagePurchases.packageId,
        purchaseDate: packagePurchases.purchaseDate,
        pricePaid: packagePurchases.pricePaid,
        paymentStatus: packagePurchases.paymentStatus,
        name: packages.name,
        description: packages.description,
      })
      .from(packagePurchases)
      .leftJoin(packages, eq(packagePurchases.packageId, packages.id))
      .where(
        and(
          eq(packagePurchases.userId, (payload as any).userId || (payload as any).id),
          eq(packagePurchases.paymentStatus, 'paid')
        )
      );

    return NextResponse.json({ packages: results });
  } catch (error) {
    console.error('Error fetching user packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}


