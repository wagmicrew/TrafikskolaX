import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, userCredits, packageContents, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer/universal-mailer';

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
            creditsTotal: content.credits,
            creditsRemaining: content.credits,
            creditType: 'lesson',
            packageId: purchase[0].id
          });
      }
    }

    // Send confirmation emails
    try {
      const { sendSwishPaymentConfirmationEmail } = await import('@/lib/email/booking-emails');
      
      // Get the user details
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, purchase[0].userId))
        .limit(1);

      if (user.length > 0) {
        await sendSwishPaymentConfirmationEmail({
          user: {
            id: user[0].id,
            email: user[0].email,
            firstName: user[0].firstName,
            lastName: user[0].lastName,
            role: user[0].role
          },
          booking: {
            id: paymentReference,
            scheduledDate: new Date().toISOString().split('T')[0],
            startTime: '',
            endTime: '',
            lessonTypeName: 'Package Purchase',
            totalPrice: purchase[0].pricePaid.toString(),
            paymentMethod: 'swish',
            swishUUID: event.paymentReference,
            paymentTime: new Date().toISOString()
          }
        });
      }
    } catch(error) {
      console.error('Error sending confirmation emails:', error);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Swish callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}
