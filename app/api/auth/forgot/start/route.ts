import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from '@/lib/redis/client';
import { sendEmail } from '@/lib/mailer/universal-mailer';

function generateCode(): string {
  // 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildEmailHtml(code: string): string {
  return `
  <div style="background:#ffffff;color:#111827;padding:24px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#dc2626,#7f1d1d);padding:20px 16px;color:#fff;text-align:center">
        <div style="font-weight:800;font-size:18px;letter-spacing:.3px">Din Trafikskola Hässleholm</div>
        <div style="opacity:.9;font-size:12px;margin-top:4px">Återställning av lösenord</div>
      </div>
      <div style="padding:28px 22px">
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5">Vi har mottagit en begäran om att återställa ditt lösenord. Använd koden nedan inom 10 minuter.</p>
        <div style="margin:18px 0;padding:18px;text-align:center;background:#fef2f2;border:1px solid #fecaca;border-radius:10px">
          <div style="font-size:34px;font-weight:900;color:#b91c1c;letter-spacing:6px">${code}</div>
        </div>
        <p style="margin:0 0 12px 0;font-size:14px;color:#374151">Om du inte begärde detta kan du ignorera detta mejl.</p>
        <div style="margin-top:22px;border-top:1px solid #e5e7eb;padding-top:14px;font-size:12px;color:#6b7280;text-align:center">
          <div>E‑post: info@dintrafikskolahlm.se • Telefon: 0760‑38 91 92</div>
        </div>
      </div>
    </div>
  </div>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Ogiltig e‑post' }, { status: 400 });
    }

    // Throttle resend: 2 minutes
    const throttleKey = `fp:throttle:${email.toLowerCase()}`;
    const throttled = await cache.exists(throttleKey);
    if (throttled) {
      return NextResponse.json({ success: false, throttled: true, retryAfterSec: 120 }, { status: 429 });
    }

    // Look up user (avoid leaking existence)
    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userRows[0];

    // Always respond success, but only send email if user exists and active
    if (user) {
      const code = generateCode();
      const codeKey = `fp:code:${email.toLowerCase()}`;
      // Store code for 10 minutes
      await cache.set(codeKey, { code }, 600);
      // Set throttle for 2 minutes
      await cache.set(throttleKey, { t: Date.now() }, 120);
      // Send email
      await sendEmail({
        to: email,
        subject: 'Återställ lösenord – Din Trafikskola',
        html: buildEmailHtml(code),
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Kunde inte initiera återställning' }, { status: 500 });
  }
}


