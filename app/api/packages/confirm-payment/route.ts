import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, userCredits, packageContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purchaseId } = await request.json();

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    // Get the purchase record
    const purchase = await db
      .select()
      .from(packagePurchases)
      .where(and(
        eq(packagePurchases.id, purchaseId),
        eq(packagePurchases.paymentStatus, 'pending')
      ))
      .limit(1);

    if (!purchase.length) {
      return NextResponse.json({ error: 'Purchase not found or already processed' }, { status: 404 });
    }

    // Update payment status
    await db
      .update(packagePurchases)
      .set({ 
        paymentStatus: 'paid',
        paidAt: new Date()
      })
      .where(eq(packagePurchases.id, purchaseId));

    // Get package contents
    const contents = await db
      .select()
      .from(packageContents)
      .where(eq(packageContents.packageId, purchase[0].packageId));

    // Add credits to user
    for (const content of contents) {
      if (content.lessonTypeId && content.credits) {
        await db
          .insert(userCredits)
          .values({
            userId: purchase[0].userId,
            lessonTypeId: content.lessonTypeId,
            creditsTotal: content.credits,
            creditsRemaining: content.credits,
            creditType: 'lesson',
            packageId: purchaseId
          });
      }
    }

// Send confirmation email to user
    try {
      if (purchase[0].userEmail) {
        await sendEmail({
          to: purchase[0].userEmail,
        subject: 'Bekräftelse på betalning',
        html: `
          <h1>Tack för ditt köp!</h1>
          <p>Din betalning har mottagits och dina krediter har aktiverats.</p>
          <p>Köp-ID: ${purchaseId}</p>
          <p>Belopp: ${purchase[0].pricePaid} kr</p>
          <p>Betalningsmetod: ${purchase[0].paymentMethod}</p>
          <p>Du kan nu boka dina lektioner i din dashboard.</p>
        `,
        messageType: 'payment_confirmation',
        });
      }
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
