import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases, users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id, type } = await request.json();

    const items: Array<{ email?: string | null; name: string; link: string }> = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (id && type) {
      if (type === 'handledar') {
        const rows = await db.select().from(handledarBookings).where(eq(handledarBookings.id, id)).limit(1);
        if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const b = rows[0] as any;
        items.push({ email: b.supervisorEmail, name: b.supervisorName || 'Handledar', link: `${baseUrl}/handledar/payment/${b.id}` });
      } else if (type === 'booking') {
        const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
        if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const b = rows[0] as any;
        let email: string | null | undefined = null;
        if (b.userId) {
          const u = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
          email = u[0]?.email;
        } else {
          email = b.guestEmail;
        }
        // Use public booking payment page
        items.push({ email, name: 'Bokning', link: `${baseUrl}/booking/payment/${b.id}` });
      } else if (type === 'order') {
        const rows = await db.select().from(packagePurchases).where(eq(packagePurchases.id, id)).limit(1);
        if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const p = rows[0] as any;
        const u = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
        // Use dedicated cart entry for package payments
        items.push({ email: u[0]?.email, name: 'Order', link: `${baseUrl}/cart?type=package&id=${p.id}` });
      } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    } else {
      // Remind all unpaid
      const handledarRows = await db.select().from(handledarBookings).where(or(eq(handledarBookings.paymentStatus, 'pending' as any), eq(handledarBookings.paymentStatus, 'unpaid' as any)));
      for (const b of handledarRows as any[]) items.push({ email: b.supervisorEmail, name: b.supervisorName || 'Handledar', link: `${baseUrl}/handledar/payment/${b.id}` });
      const bookingRows = await db.select().from(bookings).where(or(eq(bookings.paymentStatus, 'pending' as any), eq(bookings.paymentStatus, 'unpaid' as any)));
      for (const b of bookingRows as any[]) {
        let email: string | null | undefined = null;
        if (b.userId) {
          const u = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
          email = u[0]?.email;
        } else {
          email = b.guestEmail;
        }
        // Use public booking payment page
        items.push({ email, name: 'Bokning', link: `${baseUrl}/booking/payment/${b.id}` });
      }
      const purchaseRows = await db.select().from(packagePurchases).where(or(eq(packagePurchases.paymentStatus, 'pending' as any), eq(packagePurchases.paymentStatus, 'unpaid' as any)));
      for (const p of purchaseRows as any[]) {
        const u = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
        items.push({ email: u[0]?.email, name: 'Order', link: `${baseUrl}/cart?type=package&id=${p.id}` });
      }
    }

    // Send reminders via triggers (populate booking context for bookings)
    for (const it of items) {
      if (!it.email) continue;
      if (it.link.includes('/handledar/payment/')) {
        await EmailService.sendTriggeredEmail('handledar_payment_reminder', {
          user: { id: '', email: it.email, firstName: it.name || 'Deltagare', lastName: '', role: 'student' },
          booking: { id: it.link.split('/').pop() || '', scheduledDate: '', startTime: '', endTime: '', lessonTypeName: 'Handledarutbildning', totalPrice: '0', swishUUID: '', paymentMethod: 'swish' },
          customData: { links: { handledarPaymentUrl: it.link } }
        } as any);
      } else if (it.link.includes('/booking/payment/')) {
        const bookingId = it.link.split('/').pop() || '';
        // Fetch booking to fill in variables
        const bRows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
        const b = (bRows?.[0] || {}) as any;
        const scheduledDate = b?.scheduledDate ? format(new Date(b.scheduledDate), 'yyyy-MM-dd') : '';
        await EmailService.sendTriggeredEmail('booking_payment_reminder', {
          user: { id: b?.userId || '', email: it.email, firstName: it.name || 'Elev', lastName: '', role: 'student' },
          booking: { id: bookingId, scheduledDate, startTime: b?.startTime || '', endTime: b?.endTime || '', lessonTypeName: 'Körlektion', totalPrice: (b?.totalPrice != null ? String(b.totalPrice) : '0'), swishUUID: b?.swishUUID || '', paymentMethod: 'swish' },
          customData: { links: { bookingPaymentUrl: it.link } }
        } as any);
      } else {
        await EmailService.sendTriggeredEmail('package_payment_reminder', {
          user: { id: '', email: it.email, firstName: it.name || 'Elev', lastName: '', role: 'student' },
          customData: { links: { packagesPaymentUrl: it.link } }
        } as any);
      }
    }

    return NextResponse.json({ success: true, reminded: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}


