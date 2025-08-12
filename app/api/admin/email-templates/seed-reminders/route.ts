import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { emailTemplates, emailReceivers } from '@/lib/db/schema/email-templates';
import { eq } from 'drizzle-orm';

type SeedTemplate = {
  triggerType:
    | 'handledar_payment_reminder'
    | 'booking_payment_reminder'
    | 'package_payment_reminder'
    | 'swish_payment_verification';
  subject: string;
  html: string;
  receivers: Array<'student' | 'admin' | 'school'>;
};

const templates: SeedTemplate[] = [
  {
    triggerType: 'handledar_payment_reminder',
    subject: 'Påminnelse: Betalning för handledarutbildning ({{booking.shortId}})',
    html:
      '<div data-standard-email="1" style="max-width:680px;margin:0 auto;background:#0b1220;color:#fff;border-radius:16px;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">\n  <div style="background:linear-gradient(180deg,#ef4444 0%,#991b1b 100%);padding:20px 24px;">\n    <h1 style="margin:0;font-size:20px;line-height:1.2;">Slutför din betalning</h1>\n    <p style="margin:6px 0 0;opacity:.9;">Handledarutbildning <strong>{{booking.shortId}}</strong></p>\n  </div>\n  <div style="padding:20px 24px;background:#0b1220;">\n    <p>Hej {{user.firstName}}!</p>\n    <p>Vi saknar din betalning för din kommande handledarutbildning. Använd knappen nedan för att öppna betalningssidan.</p>\n    <div style="margin:16px 0;text-align:center;">\n      <a href="{{links.handledarPaymentUrl}}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Öppna betalningssida</a>\n    </div>\n    <p style="opacity:.9;">Om du redan har betalat kan du bortse från detta meddelande.</p>\n    <p style="opacity:.9;">Vänliga hälsningar,<br/>Din Trafikskola Hässleholm</p>\n  </div>\n</div>',
    receivers: ['student'],
  },
  {
    triggerType: 'booking_payment_reminder',
    subject: 'Påminnelse: Slutför din bokningsbetalning ({{booking.shortId}})',
    html:
      '<div data-standard-email="1" style="max-width:680px;margin:0 auto;background:#0b1220;color:#fff;border-radius:16px;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">\n  <div style="background:linear-gradient(180deg,#ef4444 0%,#991b1b 100%);padding:20px 24px;">\n    <h1 style="margin:0;font-size:20px;line-height:1.2;">Slutför din betalning</h1>\n    <p style="margin:6px 0 0;opacity:.9;">Bokning <strong>{{booking.shortId}}</strong></p>\n  </div>\n  <div style="padding:20px 24px;background:#0b1220;">\n    <p>Hej {{user.firstName}}!</p>\n    <p>Vi saknar din betalning för din kommande bokning. Använd knappen nedan för att öppna betalningssidan.</p>\n    <div style="margin:16px 0;text-align:center;">\n      <a href="{{links.bookingPaymentUrl}}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Öppna betalningssida</a>\n    </div>\n    <div style="margin:18px 0;padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.04);">\n      <div style="display:flex;gap:16px;flex-wrap:wrap;">\n        <div style="min-width:180px;">\n          <div style="opacity:.7;font-size:12px;">Datum</div>\n          <div style="font-weight:600;">{{booking.scheduledDate}}</div>\n        </div>\n        <div style="min-width:180px;">\n          <div style="opacity:.7;font-size:12px;">Tid</div>\n          <div style="font-weight:600;">{{booking.startTime}}–{{booking.endTime}}</div>\n        </div>\n        <div style="min-width:180px;">\n          <div style="opacity:.7;font-size:12px;">Belopp</div>\n          <div style="font-weight:600;">{{booking.totalPrice}} kr</div>\n        </div>\n      </div>\n    </div>\n    <p style="opacity:.9;">Om du redan har betalat kan du bortse från detta meddelande.</p>\n    <p style="opacity:.9;">Vänliga hälsningar,<br/>Din Trafikskola Hässleholm</p>\n  </div>\n</div>',
    receivers: ['student'],
  },
  {
    triggerType: 'package_payment_reminder',
    subject: 'Påminnelse: Betalning för paket',
    html:
      '<div data-standard-email="1" style="max-width:680px;margin:0 auto;background:#0b1220;color:#fff;border-radius:16px;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">\n  <div style="background:linear-gradient(180deg,#ef4444 0%,#991b1b 100%);padding:20px 24px;">\n    <h1 style="margin:0;font-size:20px;line-height:1.2;">Slutför din betalning</h1>\n    <p style="margin:6px 0 0;opacity:.9;">Paket</p>\n  </div>\n  <div style="padding:20px 24px;background:#0b1220;">\n    <p>Hej {{user.firstName}}!</p>\n    <p>Vi saknar din betalning för ditt paket. Använd knappen nedan för att öppna betalningssidan.</p>\n    <div style="margin:16px 0;text-align:center;">\n      <a href="{{links.packagesPaymentUrl}}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Öppna betalningssida</a>\n    </div>\n    <p style="opacity:.9;">Om du redan har betalat kan du bortse från detta meddelande.</p>\n    <p style="opacity:.9;">Vänliga hälsningar,<br/>Din Trafikskola Hässleholm</p>\n  </div>\n</div>',
    receivers: ['student'],
  },
  {
    triggerType: 'swish_payment_verification',
    subject: 'Betalningskontroll krävs',
    html:
      '<div data-standard-email="1" style="max-width:680px;margin:0 auto;background:#0b1220;color:#fff;border-radius:16px;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">\n  <div style="background:linear-gradient(180deg,#16a34a 0%,#166534 100%);padding:20px 24px;">\n    <h1 style="margin:0;font-size:20px;line-height:1.2;">Bekräfta betalning</h1>\n    <p style="margin:6px 0 0;opacity:.9;">Bokning <strong>{{booking.shortId}}</strong></p>\n  </div>\n  <div style="padding:20px 24px;background:#0b1220;">\n    <p>Hej!</p>\n    <p>En betalning behöver bekräftas. Använd länken nedan för att öppna bekräftelsesidan.</p>\n    <div style="margin:16px 0;text-align:center;">\n      <a href="{{links.adminModerationUrl}}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Öppna bekräftelsesidan</a>\n    </div>\n  </div>\n</div>',
    receivers: ['admin', 'school'],
  },
];

export async function POST(_request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const results: any[] = [];

    for (const t of templates) {
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.triggerType, t.triggerType))
        .limit(1);

      let templateId: string;
      if (existing.length) {
        const [updated] = await db
          .update(emailTemplates)
          .set({ subject: t.subject, htmlContent: t.html, isActive: true, updatedAt: new Date() })
          .where(eq(emailTemplates.id, existing[0].id))
          .returning({ id: emailTemplates.id });
        templateId = updated.id;
        results.push({ trigger: t.triggerType, action: 'updated', id: templateId });
      } else {
        const [inserted] = await db
          .insert(emailTemplates)
          .values({ triggerType: t.triggerType, subject: t.subject, htmlContent: t.html, isActive: true })
          .returning({ id: emailTemplates.id });
        templateId = inserted.id;
        results.push({ trigger: t.triggerType, action: 'inserted', id: templateId });
      }

      // Ensure receivers
      const currentReceivers = await db
        .select({ receiverType: emailReceivers.receiverType })
        .from(emailReceivers)
        .where(eq(emailReceivers.templateId, templateId));
      for (const r of t.receivers) {
        if (!currentReceivers.some((er) => er.receiverType === r)) {
          await db.insert(emailReceivers).values({ templateId, receiverType: r });
        }
      }
    }

    // Reskin all existing templates to standard wrapper if not yet standardized
    const allTemplates = await db.select().from(emailTemplates);
    const standardized: any[] = [];
    for (const tpl of allTemplates as any[]) {
      const html: string = tpl.htmlContent || '';
      if (html.includes('data-standard-email="1"')) continue;
      const safeSubject = (tpl.subject || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const wrapped = `
<div data-standard-email="1" style="max-width:680px;margin:0 auto;background:#0b1220;color:#fff;border-radius:16px;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <div style="background:linear-gradient(180deg,#ef4444 0%,#991b1b 100%);padding:20px 24px;">
    <h1 style="margin:0;font-size:20px;line-height:1.2;">${safeSubject}</h1>
  </div>
  <div style="padding:20px 24px;background:#0b1220;">${html}</div>
  <div style="padding:14px 20px;background:#0a1020;border-top:1px solid rgba(255,255,255,.12);color:#cbd5e1;font-size:12px;text-align:center;">Din Trafikskola Hässleholm</div>
</div>`;
      await db
        .update(emailTemplates)
        .set({ htmlContent: wrapped, updatedAt: new Date() })
        .where(eq(emailTemplates.id, tpl.id));
      standardized.push(tpl.id);
    }

    return NextResponse.json({ success: true, results, standardized: standardized.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to seed templates' }, { status: 500 });
  }
}


