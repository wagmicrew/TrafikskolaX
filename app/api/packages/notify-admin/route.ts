import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, packages, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { EmailService } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const { purchaseId } = await request.json();
    if (!purchaseId) return NextResponse.json({ error: 'purchaseId krävs' }, { status: 400 });

    // Load purchase
    const rows = await db.select().from(packagePurchases).where(eq(packagePurchases.id, purchaseId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: 'Order saknas' }, { status: 404 });
    const purchase = rows[0] as { id: string; userId: string; packageId: string; pricePaid?: string | number; paymentReference?: string | null };

    // Load user and package for context
    const userRows = await db.select().from(users).where(eq(users.id, purchase.userId)).limit(1);
    const pkgRows = await db.select().from(packages).where(eq(packages.id, purchase.packageId)).limit(1);
    const user = userRows[0] as { id: string; email: string; firstName: string; lastName: string; role: string } | undefined;
    const pkg = pkgRows[0] as { name?: string } | undefined;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret';

    // Signed admin confirm/deny links for the generic Swish moderation flow
    const payloadBase = { type: 'swish_action', bookingId: purchaseId, sessionType: 'order' } as const;
    const approveToken = jwt.sign({ ...payloadBase, decision: 'confirm' }, jwtSecret, { expiresIn: '30m' });
    const denyToken = jwt.sign({ ...payloadBase, decision: 'deny' }, jwtSecret, { expiresIn: '30m' });
    const adminApproveUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(approveToken)}`;
    const adminDenyUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(denyToken)}`;

    // Send using email trigger with admin action links
    const ok = await EmailService.sendTriggeredEmail('swish_payment_verification', {
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      } : undefined,
      booking: {
        id: purchaseId,
        scheduledDate: '',
        startTime: '',
        endTime: '',
        lessonTypeName: `Paket: ${pkg?.name || ''}`,
        totalPrice: String(purchase.pricePaid || '0'),
        swishUUID: purchase.paymentReference,
        paymentMethod: 'swish',
      },
      customData: {
        adminApproveUrl,
        adminDenyUrl,
        links: {
          adminModerationUrl: `${baseUrl}/dashboard/admin/payments/swish`
        },
        adminActionButtons: `
          <div style="text-align:center;margin:24px 0;">
            <a href="${adminApproveUrl}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;margin-right:8px;">Bekräfta betalning</a>
            <a href="${adminDenyUrl}" style="background:#dc2626;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;">Ingen betalning mottagen</a>
          </div>`,
      }
    } as Record<string, unknown>);

    if (!ok) {
      return NextResponse.json({ success: true, warning: 'E-post delvis skickad. Kontrollera e-postinställningar.' });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internt fel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


