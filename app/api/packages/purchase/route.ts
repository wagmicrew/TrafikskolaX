import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages, packagePurchases, siteSettings, userCredits, packageContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { qliroService } from '@/lib/payment/qliro-service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;
    const { packageId, paymentMethod } = await request.json();

    if (!packageId || typeof packageId !== 'string' || !paymentMethod) {
      return NextResponse.json({ error: 'Valid package ID and payment method are required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(packageId)) {
      return NextResponse.json({ error: 'Invalid package ID format' }, { status: 400 });
    }

    // Fetch package details
    const packageData = await db
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.isActive, true)))
      .limit(1);

    if (!packageData.length) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const pkg = packageData[0];
    
    // Calculate effective price (coerce to number from DB types)
    const toNumber = (v: unknown): number => typeof v === 'number' ? v : Number(v ?? 0);
    let effectivePrice: number = toNumber(pkg.price);
    if (pkg.salePrice !== null && pkg.salePrice !== undefined) {
      effectivePrice = toNumber(pkg.salePrice);
    } else if (user.role === 'student' && pkg.priceStudent !== null && pkg.priceStudent !== undefined) {
      effectivePrice = toNumber(pkg.priceStudent);
    }

    // Get payment settings
    const settings = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.category, 'payment'));

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value ?? '';
      return acc;
    }, {} as Record<string, string>);

    // Create purchase record
    const purchase = await db
      .insert(packagePurchases)
      .values({
        userId: user.id,
        packageId: packageId,
        pricePaid: effectivePrice.toFixed(2),
        paymentMethod: paymentMethod,
        paymentStatus: 'pending',
        userEmail: user.email
      })
      .returning();

    const purchaseId = purchase[0].id;

    if (paymentMethod === 'swish') {
      return handleSwishPayment(purchaseId, effectivePrice, settingsMap, pkg.name);
    } else if (paymentMethod === 'qliro') {
      return handleQliroPayment(purchaseId, effectivePrice, settingsMap, pkg, user);
    } else {
      return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
    }
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}

async function handleSwishPayment(purchaseId: string, amount: number, settings: Record<string, string>, packageName: string) {
  const payeeNumber = settings.swish_payee_number;
  const callbackUrl = settings.swish_callback_url;

  if (!payeeNumber) {
    return NextResponse.json({ error: 'Swish not configured' }, { status: 500 });
  }

  // Create Swish payment request
  const swishData = {
    payeePaymentReference: purchaseId,
    callbackUrl: `${callbackUrl}/api/payments/swish/callback`,
    payerAlias: '', // Will be filled by user
    payeeAlias: payeeNumber,
    amount: amount.toString(),
    currency: 'SEK',
    message: `Paketköp: ${packageName}`
  };

  try {
    // In a real implementation, you would call Swish API here
    // For now, we'll simulate the response
    const swishUrl = `swish://payment?data=${encodeURIComponent(JSON.stringify(swishData))}`;
    
    return NextResponse.json({
      success: true,
      swishUrl: swishUrl,
      purchaseId: purchaseId
    });
  } catch (error) {
    console.error('Swish payment error:', error);
    return NextResponse.json({ error: 'Swish payment failed' }, { status: 500 });
  }
}

type BasicUser = { email?: string; phone?: string | number; firstName?: string; lastName?: string };
type BasicPkg = { name?: string };

async function handleQliroPayment(purchaseId: string, amount: number, _settings: Record<string, string>, pkg: BasicPkg, user: BasicUser) {
  try {
    // Ensure service is enabled via site_settings
    const enabled = await qliroService.isEnabled();
    if (!enabled) {
      return NextResponse.json({ error: 'Qliro payment is not available' }, { status: 503 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const checkout = await qliroService.createCheckout({
      amount,
      reference: purchaseId,
      description: pkg?.name || `Paketköp ${purchaseId}`,
      returnUrl: `${baseUrl}/payments/qliro/return?purchase=${purchaseId}`,
      customerEmail: user?.email,
      customerPhone: user?.phone,
      customerFirstName: user?.firstName,
      customerLastName: user?.lastName,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkoutUrl,
      purchaseId,
    });
  } catch (error) {
    console.error('Qliro payment error:', error);
    const message = error instanceof Error ? error.message : 'Qliro payment failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// Webhook handler for payment confirmations
export async function PUT(request: NextRequest) {
  try {
    const { purchaseId, status, paymentMethod } = await request.json();

    if (status === 'completed') {
      // Update purchase status
      await db
        .update(packagePurchases)
        .set({ paymentStatus: 'paid' })
        .where(eq(packagePurchases.id, purchaseId));

      // Get purchase details
      const purchaseData = await db
        .select({
          userId: packagePurchases.userId,
          packageId: packagePurchases.packageId,
        })
        .from(packagePurchases)
        .where(eq(packagePurchases.id, purchaseId))
        .limit(1);

      if (purchaseData.length > 0) {
        const { userId, packageId } = purchaseData[0];

        // Add credits to user account
        const packageContentsData = await db
          .select({
            lessonTypeId: packageContents.lessonTypeId,
            credits: packageContents.credits,
          })
          .from(packageContents)
          .where(eq(packageContents.packageId, packageId));

        for (const content of packageContentsData) {
          if (content.lessonTypeId && content.credits) {
            // Check if user already has credits for this lesson type
            const existingCredits = await db
              .select()
              .from(userCredits)
              .where(and(
                eq(userCredits.userId, userId),
                eq(userCredits.lessonTypeId, content.lessonTypeId)
              ))
              .limit(1);

            if (existingCredits.length > 0) {
              // Update existing credits
              await db
                .update(userCredits)
                .set({
                  creditsRemaining: existingCredits[0].creditsRemaining + content.credits,
                  creditsTotal: existingCredits[0].creditsTotal + content.credits,
                })
                .where(eq(userCredits.id, existingCredits[0].id));
            } else {
              // Create new credits entry
              await db
                .insert(userCredits)
                .values({
                  userId: userId,
                  lessonTypeId: content.lessonTypeId,
                  creditsRemaining: content.credits,
                  creditsTotal: content.credits,
                  packageId: packageId,
                });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 500 });
  }
}
