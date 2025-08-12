import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { bookings, handledarBookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';

type Decision = 'confirm' | 'deny' | 'remind';

function verifyActionToken(token: string): { type: string; bookingId: string; sessionType?: 'handledar' | 'regular' | 'order'; decision?: Decision } {
  const secret = process.env.JWT_SECRET || 'your-fallback-secret';
  const payload = jwt.verify(token, secret) as any;
  return payload;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token saknas' }, { status: 400 });
    const payload = verifyActionToken(token);
    if (!payload || payload.type !== 'swish_action' || !payload.bookingId) {
      return NextResponse.json({ error: 'Ogiltig token' }, { status: 400 });
    }
    const sessionType = payload.sessionType || 'regular';

    if (sessionType === 'handledar') {
      const rows = await db.select().from(handledarBookings).where(eq(handledarBookings.id, payload.bookingId)).limit(1);
      if (!rows.length) return NextResponse.json({ error: 'Bokning saknas' }, { status: 404 });
      const b: any = rows[0];
      return NextResponse.json({
        item: {
          id: b.id,
          type: 'handledar',
          name: b.supervisorName,
          email: b.supervisorEmail,
          phone: b.supervisorPhone,
          amount: b.price,
          status: b.paymentStatus,
        },
        token,
        suggestedDecision: payload.decision || null,
      });
    }

    // Regular lesson booking
    const rows = await db.select().from(bookings).where(eq(bookings.id, payload.bookingId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: 'Bokning saknas' }, { status: 404 });
    const b: any = rows[0];
    let email: string | null = null;
    if (b.userId) {
      const u = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
      email = u[0]?.email || null;
    } else {
      email = b.guestEmail || null;
    }
    return NextResponse.json({
      item: {
        id: b.id,
        type: 'booking',
        name: 'Bokning',
        email,
        phone: b.guestPhone || null,
        amount: b.totalPrice,
        status: b.paymentStatus,
      },
      token,
      suggestedDecision: payload.decision || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ogiltig token' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, decision }: { token: string; decision?: Decision } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token saknas' }, { status: 400 });
    const payload = verifyActionToken(token);
    if (!payload || payload.type !== 'swish_action' || !payload.bookingId) {
      return NextResponse.json({ error: 'Ogiltig token' }, { status: 400 });
    }
    const action: Decision = (decision || payload.decision || 'confirm') as Decision;
    const sessionType = payload.sessionType || 'regular';

    if (sessionType === 'handledar') {
      const rows = await db.select().from(handledarBookings).where(eq(handledarBookings.id, payload.bookingId)).limit(1);
      if (!rows.length) return NextResponse.json({ error: 'Bokning saknas' }, { status: 404 });
      const b: any = rows[0];
      if (action === 'confirm') {
        await db.update(handledarBookings).set({ status: 'confirmed' as any, paymentStatus: 'paid' as any, updatedAt: new Date() }).where(eq(handledarBookings.id, b.id));
        // Optionally send thank-you email
      } else if (action === 'deny') {
        await db.update(handledarBookings).set({ status: 'cancelled' as any, paymentStatus: 'failed' as any, updatedAt: new Date() }).where(eq(handledarBookings.id, b.id));
      } else if (action === 'remind') {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        if (b.supervisorEmail) {
          await EmailService.sendEmail({
            to: b.supervisorEmail,
            subject: 'Påminnelse: Betalning för handledarutbildning',
            messageType: 'general',
            html: `<p>Hej ${b.supervisorName || ''}!</p><p>Vi saknar din betalning. Använd länken för att betala: <a href="${baseUrl}/handledar/payment/${b.id}">${baseUrl}/handledar/payment/${b.id}</a></p>`,
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    // Regular lesson booking
    const rows = await db.select().from(bookings).where(eq(bookings.id, payload.bookingId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: 'Bokning saknas' }, { status: 404 });
    const b: any = rows[0];
    if (action === 'confirm') {
      await db.update(bookings).set({ status: 'confirmed' as any, paymentStatus: 'paid' as any, updatedAt: new Date() }).where(eq(bookings.id, b.id));
    } else if (action === 'deny') {
      await db.update(bookings).set({ status: 'cancelled' as any, paymentStatus: 'failed' as any, updatedAt: new Date() }).where(eq(bookings.id, b.id));
    } else if (action === 'remind') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      // No public page for regular bookings yet; send generic link
      // If guest email available, send to that; otherwise try user email
      let email: string | null = null;
      if (b.userId) {
        const u = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
        email = u[0]?.email || null;
      } else {
        email = b.guestEmail || null;
      }
      if (email) {
        await EmailService.sendEmail({
          to: email,
          subject: 'Påminnelse: Betalning krävs',
          messageType: 'general',
          html: `<p>Hej!</p><p>Vi saknar din betalning för bokning ${b.id.slice(0,7)}.</p>`,
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ogiltig token' }, { status: 400 });
  }
}

// Remove duplicated handlers accidentally appended below (caused build error)


