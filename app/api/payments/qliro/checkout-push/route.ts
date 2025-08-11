import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, packagePurchases, userCredits, packageContents, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cache } from '@/lib/redis/client';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const body = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stored = await cache.get(`qliro:push:${token}`);
    if (!stored) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { OrderId, MerchantReference, Status, NotificationType, PaymentTransactionId } = body || {};

    if (!OrderId || !MerchantReference || !Status) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    // Idempotent handling; allow duplicates as per docs
    if (MerchantReference.startsWith('booking_')) {
      const bookingId = MerchantReference.replace('booking_', '');
      if (Status === 'Completed') {
        await db.update(bookings)
          .set({ paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date() })
          .where(eq(bookings.id, bookingId));
      } else if (Status === 'OnHold') {
        await db.update(bookings)
          .set({ paymentStatus: 'pending', status: 'confirmed', updatedAt: new Date() })
          .where(eq(bookings.id, bookingId));
      }
    } else if (MerchantReference.startsWith('package_')) {
      const purchaseId = MerchantReference.replace('package_', '');
      if (Status === 'Completed') {
        // Mark package paid and issue credits
        const [purchase] = await db.select().from(packagePurchases).where(eq(packagePurchases.id, purchaseId)).limit(1);
        if (purchase) {
          await db.update(packagePurchases)
            .set({ paymentStatus: 'paid', paidAt: new Date(), paymentReference: String(OrderId) })
            .where(eq(packagePurchases.id, purchaseId));

          const contents = await db.select().from(packageContents).where(eq(packageContents.packageId, purchase.packageId));
          for (const content of contents) {
            const isHandledar = content.contentType === 'handledar' || !content.lessonTypeId;
            const existing = await db.select().from(userCredits)
              .where(and(eq(userCredits.userId, purchase.userId), isHandledar ? eq(userCredits.creditType, 'handledar') : eq(userCredits.lessonTypeId, content.lessonTypeId!)))
              .limit(1);
            if (existing.length) {
              await db.update(userCredits)
                .set({ creditsRemaining: (existing[0].creditsRemaining || 0) + (content.credits || 0), creditsTotal: (existing[0].creditsTotal || 0) + (content.credits || 0), updatedAt: new Date() })
                .where(eq(userCredits.id, existing[0].id));
            } else {
              await db.insert(userCredits).values({
                userId: purchase.userId,
                lessonTypeId: isHandledar ? null : content.lessonTypeId,
                handledarSessionId: null,
                creditsRemaining: content.credits || 0,
                creditsTotal: content.credits || 0,
                packageId: purchase.packageId,
                creditType: isHandledar ? 'handledar' : 'lesson'
              });
            }
          }
        }
      } else if (Status === 'OnHold') {
        await db.update(packagePurchases)
          .set({ paymentStatus: 'pending' })
          .where(eq(packagePurchases.id, purchaseId));
      }
    }

    return NextResponse.json({ CallbackResponse: 'received' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



