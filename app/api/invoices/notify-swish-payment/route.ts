import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { EmailService } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, swishMessage } = await request.json();
    if (!invoiceId) return NextResponse.json({ error: 'invoiceId krävs' }, { status: 400 });

    // Load invoice
    const invoiceRows = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!invoiceRows.length) return NextResponse.json({ error: 'Faktura saknas' }, { status: 404 });
    const invoice = invoiceRows[0];

    // Load user for context
    const userRows = await db.select().from(users).where(eq(users.id, invoice.user_id || '')).limit(1);
    const user = userRows[0];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret';

    // Create signed admin action links for confirming/denying the Swish payment
    const payloadBase = { type: 'swish_action', invoiceId: invoiceId, sessionType: 'invoice' } as const;
    const approveToken = jwt.sign({ ...payloadBase, decision: 'confirm' }, jwtSecret, { expiresIn: '30m' });
    const denyToken = jwt.sign({ ...payloadBase, decision: 'deny' }, jwtSecret, { expiresIn: '30m' });
    const adminApproveUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(approveToken)}`;
    const adminDenyUrl = `${baseUrl}/api/admin/swish/email-action?token=${encodeURIComponent(denyToken)}`;

    // Send notification email to admin
    const ok = await EmailService.sendTriggeredEmail('swish_payment_verification', {
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      } : undefined,
      booking: {
        id: invoiceId,
        scheduledDate: '',
        startTime: '',
        endTime: '',
        lessonTypeName: invoice.description || `Faktura ${invoice.invoice_number}`,
        totalPrice: String(invoice.amount),
        swishUUID: swishMessage,
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
