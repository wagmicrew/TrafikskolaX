import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, userCredits, packageContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Verify Qliro signature
function verifyQliroSignature(signature: string, body: string, secret: string): boolean {
  // In a real implementation, verify the signature using Qliro's secret
  // This is a simplified version - you should implement proper signature verification
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Qliro-Signature');
    const body = await request.text();
    
    // Verify the webhook signature
    const isValid = verifyQliroSignature(
      signature || '',
      body,
      process.env.QLIRO_WEBHOOK_SECRET || ''
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const orderId = event.OrderId;
    const status = event.Status;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // Only process paid orders
    if (status !== 'Paid') {
      return NextResponse.json({ received: true });
    }

    // Get the purchase record
    const purchase = await db
      .select()
      .from(packagePurchases)
      .where(and(
        eq(packagePurchases.id, orderId),
        eq(packagePurchases.paymentStatus, 'pending')
      ))
      .limit(1);

    if (!purchase.length) {
      return NextResponse.json({ received: true });
    }

    // Update payment status
    await db
      .update(packagePurchases)
      .set({ 
        paymentStatus: 'paid',
        paidAt: new Date(),
        paymentReference: event.PaymentReference
      })
      .where(eq(packagePurchases.id, orderId));

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
            credits: content.credits,
            source: 'package_purchase',
            sourceId: orderId
          });
      }
    }

    // Send confirmation email to user
    await resend.emails.send({
      from: 'info@trafikskolax.se',
      to: purchase[0].userEmail,
      subject: 'Bekräftelse på betalning',
      html: `
        <h1>Tack för ditt köp!</h1>
        <p>Din betalning har mottagits och dina krediter har aktiverats.</p>
        <p>Köp-ID: ${orderId}</p>
        <p>Betalningsreferens: ${event.PaymentReference || 'Ej tillgänglig'}</p>
        <p>Du kan nu boka dina lektioner i din dashboard.</p>
      `
    });

    // Notify admin
    await resend.emails.send({
      from: 'noreply@trafikskolax.se',
      to: 'admin@trafikskolax.se',
      subject: 'Ny betalning mottagen',
      html: `
        <h1>Ny betalning mottagen</h1>
        <p>En betalning har genomförts via Qliro.</p>
        <p>Kund: ${purchase[0].userEmail}</p>
        <p>Köp-ID: ${orderId}</p>
        <p>Belopp: ${purchase[0].pricePaid} kr</p>
        <p>Betalningsreferens: ${event.PaymentReference || 'Ej tillgänglig'}</p>
      `
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Qliro webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
