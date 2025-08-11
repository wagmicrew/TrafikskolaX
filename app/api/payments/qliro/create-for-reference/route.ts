import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, packagePurchases, packages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { qliroService } from '@/lib/payment/qliro-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body as { reference: string };
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (reference.startsWith('booking_')) {
      const bookingId = reference.replace('booking_', '');
      const [bk] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
      if (!bk) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      // Resolve recipient/customer
      let customerEmail = bk.guestEmail || '';
      let customerPhone = bk.guestPhone || '';
      let customerFirstName = bk.guestName || '';
      let customerLastName = '';
      if (bk.userId) {
        const [usr] = await db.select().from(users).where(eq(users.id, bk.userId)).limit(1);
        if (usr) {
          customerEmail = usr.email || customerEmail;
          customerPhone = usr.phone || customerPhone;
          customerFirstName = usr.firstName || customerFirstName;
          customerLastName = usr.lastName || customerLastName;
        }
      }

      const result = await qliroService.createCheckout({
        amount: Number(bk.totalPrice || 0),
        reference: `booking_${bk.id}`,
        description: 'Körlektion',
        returnUrl: `${baseUrl}/dashboard/student/bokningar/${bk.id}`,
        customerEmail,
        customerPhone,
        customerFirstName,
        customerLastName,
      });

      return NextResponse.json({ success: true, ...result });
    }

    if (reference.startsWith('package_')) {
      const purchaseId = reference.replace('package_', '');
      const [purchase] = await db.select().from(packagePurchases).where(eq(packagePurchases.id, purchaseId)).limit(1);
      if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

      const [pkg] = await db.select().from(packages).where(eq(packages.id, purchase.packageId)).limit(1);

      // Resolve user
      const [usr] = await db.select().from(users).where(eq(users.id, purchase.userId)).limit(1);

      const result = await qliroService.createCheckout({
        amount: Number(purchase.pricePaid || 0),
        reference: `package_${purchase.id}`,
        description: pkg?.name || 'Paket',
        returnUrl: `${baseUrl}/dashboard/student`,
        customerEmail: usr?.email,
        customerPhone: usr?.phone || undefined,
        customerFirstName: usr?.firstName || undefined,
        customerLastName: usr?.lastName || undefined,
      });

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: 'Unsupported reference' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}




