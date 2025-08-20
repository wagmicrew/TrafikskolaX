import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, handledarBookings, packagePurchases, packageContents, userCredits, users, packages as pkgTable } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const { id, type } = await request.json();
    if (!id || !type) return NextResponse.json({ error: 'id and type required' }, { status: 400 });

    if (type === 'handledar') {
      await db.update(handledarBookings).set({ paymentStatus: 'paid' as 'paid', status: 'confirmed' as 'confirmed', updatedAt: new Date() }).where(eq(handledarBookings.id, id));
    } else if (type === 'booking') {
      await db.update(bookings).set({ paymentStatus: 'paid' as 'paid', status: 'confirmed' as 'confirmed', updatedAt: new Date() }).where(eq(bookings.id, id));
    } else if (type === 'order') {
      // Mark purchase as paid
      await db.update(packagePurchases).set({ paymentStatus: 'paid' as 'paid', paidAt: new Date() }).where(eq(packagePurchases.id, id));

      // Fetch purchase details
      const purchaseRows = await db.select().from(packagePurchases).where(eq(packagePurchases.id, id)).limit(1);
      const purchase = purchaseRows[0] as any;

      // Add credits to user from package contents
      const contents = await db.select().from(packageContents).where(eq(packageContents.packageId, purchase.packageId));
      for (const content of contents as Array<{ contentType: 'lesson' | 'handledar' | 'text'; lessonTypeId?: string; handledarSessionId?: string; credits?: number }>) {
        const addAmount = Number(content.credits || 0);
        if (!addAmount) continue;

        if (content.lessonTypeId) {
          // Lesson credits per lesson type
          const existing = await db
            .select()
            .from(userCredits)
            .where(and(eq(userCredits.userId, purchase.userId), eq(userCredits.lessonTypeId, content.lessonTypeId)))
            .limit(1);
          if (existing.length) {
            await db.update(userCredits).set({
              creditsRemaining: Number(existing[0].creditsRemaining || 0) + addAmount,
              creditsTotal: Number(existing[0].creditsTotal || 0) + addAmount,
            updatedAt: new Date(),
            }).where(eq(userCredits.id, (existing[0] as any).id));
          } else {
            await db.insert(userCredits).values({
              userId: purchase.userId,
              lessonTypeId: content.lessonTypeId,
              creditsRemaining: addAmount,
              creditsTotal: addAmount,
              packageId: purchase.packageId,
          creditType: 'lesson',
            });
          }
        } else if ((content.handledarSessionId && content.handledarSessionId.length > 0) || content.contentType === 'handledar') {
          // Handledar credits (session based)
          const existing = await db
            .select()
            .from(userCredits)
            .where(
              and(
                eq(userCredits.userId, purchase.userId),
                content.handledarSessionId ? eq(userCredits.handledarSessionId, content.handledarSessionId) : eq(userCredits.handledarSessionId, purchase.packageId) // dummy compare to keep AND typed
              )
            )
            .limit(1);
          if (existing.length) {
            await db.update(userCredits).set({
              creditsRemaining: Number(existing[0].creditsRemaining || 0) + addAmount,
              creditsTotal: Number(existing[0].creditsTotal || 0) + addAmount,
            updatedAt: new Date(),
            }).where(eq(userCredits.id, (existing[0] as any).id));
          } else {
            await db.insert(userCredits).values({
              userId: purchase.userId,
              handledarSessionId: content.handledarSessionId || null as any,
              creditsRemaining: addAmount,
              creditsTotal: addAmount,
              packageId: purchase.packageId,
          creditType: 'handledar',
            });
          }
        }
      }

      // Send activation email to user using template system
      try {
        const { EmailService } = await import('@/lib/email/email-service');
        const userRows = await db.select().from(users).where(eq(users.id, purchase.userId)).limit(1);
        const pkgRows = await db.select().from(pkgTable).where(eq(pkgTable.id, purchase.packageId)).limit(1);
        const u = userRows[0] as any;
        const pkg = pkgRows[0] as any;

        await EmailService.sendTriggeredEmail('payment_confirmed', {
          user: { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role },
          booking: { id: purchase.id, lessonTypeName: `Paket: ${pkg?.name || ''}`, totalPrice: String(purchase.pricePaid || '0'), paymentMethod: 'swish' }
        } as any);

        // Also send a follow-up email that package is active and link to booking
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        await EmailService.sendTriggeredEmail('booking_confirmed', {
          user: { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role },
          booking: { id: purchase.id, lessonTypeName: `Paket aktivt`, totalPrice: String(purchase.pricePaid || '0') },
          customData: { links: { bookingFlowUrl: `${appUrl}/boka-korning` } }
        } as any);
      } catch (e) {
        // Non-fatal
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}


