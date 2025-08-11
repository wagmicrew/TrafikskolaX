import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

    const body = await request.json();
    const { bookingId, decision } = body as { bookingId: string; decision: 'confirm' | 'deny' };
    if (!bookingId || !decision) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

    const [bk] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!bk) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (decision === 'confirm') {
      await db.update(bookings)
        .set({ paymentStatus: 'paid', status: 'confirmed', paymentMethod: 'swish', updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
      // Notify user payment confirmed
      const [usr] = bk.userId ? await db.select().from(users).where(eq(users.id, bk.userId)).limit(1) : [] as any;
      await EmailService.sendTriggeredEmail('payment_confirmed', {
        user: usr ? { id: usr.id, email: usr.email, firstName: usr.firstName, lastName: usr.lastName, role: usr.role } : undefined,
        booking: {
          id: bk.id,
          scheduledDate: String(bk.scheduledDate),
          startTime: String(bk.startTime),
          endTime: String(bk.endTime),
          lessonTypeName: 'Körlektion',
          totalPrice: String(bk.totalPrice || '0'),
        }
      } as any);
    } else {
      await db.update(bookings)
        .set({ paymentStatus: 'unpaid', status: 'confirmed', paymentMethod: null, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
      // Notify user payment denied
      const [usr] = bk.userId ? await db.select().from(users).where(eq(users.id, bk.userId)).limit(1) : [] as any;
      await EmailService.sendTriggeredEmail('payment_declined', {
        user: usr ? { id: usr.id, email: usr.email, firstName: usr.firstName, lastName: usr.lastName, role: usr.role } : undefined,
        booking: {
          id: bk.id,
          scheduledDate: String(bk.scheduledDate),
          startTime: String(bk.startTime),
          endTime: String(bk.endTime),
          lessonTypeName: 'Körlektion',
          totalPrice: String(bk.totalPrice || '0'),
        },
        customData: { message: 'Din Swish-betalning kunde inte bekräftas. Logga in och välj annat betalningssätt.' }
      } as any);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}




