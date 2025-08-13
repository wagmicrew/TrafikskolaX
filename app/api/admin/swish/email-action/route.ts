import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { bookings, handledarBookings, users, packagePurchases, packageContents, userCredits, packages as pkgTable } from '@/lib/db/schema';
import { and } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';

type Decision = 'confirm' | 'deny' | 'remind';

  function verifyActionToken(token: string): { type: string; bookingId: string; sessionType?: 'handledar' | 'regular' | 'order'; decision?: Decision } {
  const secret = process.env.JWT_SECRET || 'your-fallback-secret';
  const payload = jwt.verify(token, secret) as { action?: string; id?: string };
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

    if (sessionType === 'order') {
      const rows = await db.select().from(packagePurchases).where(eq(packagePurchases.id, payload.bookingId)).limit(1);
      if (!rows.length) return NextResponse.json({ error: 'Order saknas' }, { status: 404 });
      const p: any = rows[0];
      // Resolve user for display
      let name = 'Paketköp'; let email: string | null = null;
      if (p.userId) {
        const u = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
        if (u.length) { name = `${u[0].firstName || ''} ${u[0].lastName || ''}`.trim() || (u[0].email || name); email = u[0].email; }
      }
      return NextResponse.json({
        item: {
          id: p.id,
          type: 'order',
          name,
          email,
          phone: null,
          amount: p.pricePaid,
          status: p.paymentStatus,
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
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ogiltig token';
    return NextResponse.json({ error: message }, { status: 400 });
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
        await db.update(handledarBookings).set({ status: 'confirmed' as 'confirmed', paymentStatus: 'paid' as 'paid', updatedAt: new Date() }).where(eq(handledarBookings.id, b.id));
        // Optionally send thank-you email
      } else if (action === 'deny') {
        await db.update(handledarBookings).set({ status: 'cancelled' as 'cancelled', paymentStatus: 'failed' as 'failed', updatedAt: new Date() }).where(eq(handledarBookings.id, b.id));
      } else if (action === 'remind') {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
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

    if (sessionType === 'order') {
      const rows = await db.select().from(packagePurchases).where(eq(packagePurchases.id, payload.bookingId)).limit(1);
      if (!rows.length) return NextResponse.json({ error: 'Order saknas' }, { status: 404 });
      const p: any = rows[0];
      if (action === 'confirm') {
        // Mark paid
        await db.update(packagePurchases).set({ paymentStatus: 'paid' as 'paid', paidAt: new Date() }).where(eq(packagePurchases.id, p.id));
        // Add credits from package contents
        const contents = await db.select().from(packageContents).where(eq(packageContents.packageId, p.packageId));
        for (const content of contents as Array<{ contentType: 'lesson' | 'handledar' | 'text'; lessonTypeId?: string; handledarSessionId?: string; credits?: number }>) {
          const addAmount = Number(content.credits || 0);
          if (!addAmount) continue;
          if (content.lessonTypeId) {
            const existing = await db.select().from(userCredits).where(and(eq(userCredits.userId, p.userId), eq(userCredits.lessonTypeId, content.lessonTypeId))).limit(1);
            if (existing.length) {
              await db.update(userCredits).set({
                creditsRemaining: Number(existing[0].creditsRemaining || 0) + addAmount,
                creditsTotal: Number(existing[0].creditsTotal || 0) + addAmount,
                updatedAt: new Date(),
              }).where(eq(userCredits.id, (existing[0] as any).id));
            } else {
              await db.insert(userCredits).values({ userId: p.userId, lessonTypeId: content.lessonTypeId, creditsRemaining: addAmount, creditsTotal: addAmount, packageId: p.packageId, creditType: 'lesson' });
            }
          } else if (content.handledarSessionId || content.contentType === 'handledar') {
            const existing = await db.select().from(userCredits).where(and(eq(userCredits.userId, p.userId), eq(userCredits.handledarSessionId, content.handledarSessionId))).limit(1);
            if (existing.length) {
              await db.update(userCredits).set({
                creditsRemaining: Number(existing[0].creditsRemaining || 0) + addAmount,
                creditsTotal: Number(existing[0].creditsTotal || 0) + addAmount,
                updatedAt: new Date(),
              }).where(eq(userCredits.id, (existing[0] as any).id));
            } else {
              await db.insert(userCredits).values({ userId: p.userId, handledarSessionId: content.handledarSessionId, creditsRemaining: addAmount, creditsTotal: addAmount, packageId: p.packageId, creditType: 'handledar' });
            }
          }
        }
        // Send activation email
        try {
          const { EmailService } = await import('@/lib/email/email-service');
          const uRows = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
          const pkgRows = await db.select().from(pkgTable).where(eq(pkgTable.id, p.packageId)).limit(1);
          const u = uRows[0] as { id: string; email: string; firstName: string; lastName: string; role: 'student' | 'teacher' | 'admin' };
          const pkg = pkgRows[0] as { name?: string };
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          await EmailService.sendTriggeredEmail('payment_confirmed', { user: { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role }, booking: { id: p.id, lessonTypeName: `Paket: ${pkg?.name || ''}`, totalPrice: String(p.pricePaid || '0'), paymentMethod: 'swish' } } as Record<string, unknown>);
          await EmailService.sendTriggeredEmail('booking_confirmed', { user: { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role }, booking: { id: p.id, lessonTypeName: 'Paket aktivt', totalPrice: String(p.pricePaid || '0') }, customData: { links: { bookingFlowUrl: `${appUrl}/boka-korning` } } } as Record<string, unknown>);
        } catch {}
      } else if (action === 'deny') {
        await db.update(packagePurchases).set({ paymentStatus: 'failed' as 'failed' }).where(eq(packagePurchases.id, p.id));
      } else if (action === 'remind') {
        // Send package payment reminder
        try {
          await EmailService.sendTriggeredEmail('package_payment_reminder', { user: { id: '', email: p.userEmail || '', firstName: '', lastName: '', role: 'student' }, customData: { links: { packagesPaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/cart?type=package&id=${p.id}` } } } as Record<string, unknown>);
        } catch {}
      }
      return NextResponse.json({ success: true });
    }

    // Regular lesson booking
    const rows = await db.select().from(bookings).where(eq(bookings.id, payload.bookingId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: 'Bokning saknas' }, { status: 404 });
    const b: any = rows[0];
    if (action === 'confirm') {
      await db.update(bookings).set({ status: 'confirmed' as 'confirmed', paymentStatus: 'paid' as 'paid', updatedAt: new Date() }).where(eq(bookings.id, b.id));
    } else if (action === 'deny') {
      await db.update(bookings).set({ status: 'cancelled' as 'cancelled', paymentStatus: 'failed' as 'failed', updatedAt: new Date() }).where(eq(bookings.id, b.id));
    } else if (action === 'remind') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
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
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ogiltig token';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Remove duplicated handlers accidentally appended below (caused build error)


