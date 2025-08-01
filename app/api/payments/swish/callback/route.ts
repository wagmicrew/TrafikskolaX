import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, userCredits, packageContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Verify Swish signature
function verifySwishSignature(signature: string, body: string, certificate: string): boolean {
  // In a real implementation, verify the signature using Swish's certificate
  // This is a simplified version - you should implement proper signature verification
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('swish-signature');
    const body = await request.text();
    
    // Verify the webhook signature
    const isValid = verifySwishSignature(
      signature || '',
      body,
      process.env.SWISH_CERTIFICATE || ''
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const paymentReference = event.payeePaymentReference;
    const status = event.status;

    if (!paymentReference || !status) {
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }

    // Only process paid orders
    if (status !== 'PAID') {
      return NextResponse.json({ received: true });
    }

    // Get the purchase record
    const purchase = await db
      .select()
      .from(packagePurchases)
      .where(and(
        eq(packagePurchases.id, paymentReference),
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
        paymentReference: event.paymentReference
      })
      .where(eq(packagePurchases.id, paymentReference));

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
            sourceId: paymentReference
          });
      }
    }

    // Send confirmation email to user
    await resend.emails.send({
      from: 'info@trafikskolax.se',
      to: purchase[0].userEmail,
      subject: 'Bekräftelse på betalning',
      html: `
        <h1>Tack för din betalning!</h1>
        <p>Din Swish-betalning har mottagits och dina krediter har aktiverats.</p>
        <p>Köp-ID: ${paymentReference}</p>
        <p>Betalningsreferens: ${event.paymentReference || 'Ej tillgänglig'}</p>
        <p>Du kan nu boka dina lektioner i din dashboard.</p>
      `
    });

    // Notify admin
    await resend.emails.send({
      from: 'noreply@trafikskolax.se',
      to: 'admin@trafikskolax.se',
      subject: 'Ny Swish-betalning mottagen',
      html: `
        <h1>Ny Swish-betalning mottagen</h1>
        <p>En betalning har genomförts via Swish.</p>
        <p>Kund: ${purchase[0].userEmail}</p>
        <p>Köp-ID: ${paymentReference}</p>
        <p>Belopp: ${purchase[0].pricePaid} kr</p>
        <p>Betalningsreferens: ${event.paymentReference || 'Ej tillgänglig'}</p>
      `
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Swish callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}
