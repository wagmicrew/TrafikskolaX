import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from '@/lib/redis/client';
import { hash } from 'bcryptjs';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();
    if (!email || !newPassword) return NextResponse.json({ error: 'Saknar data' }, { status: 400 });

    // Require prior verification
    const tokenKey = `fp:verified:${email.toLowerCase()}`;
    const verified = await cache.get(tokenKey);
    if (!verified?.ok) return NextResponse.json({ error: 'Ej verifierad' }, { status: 403 });

    const hashed = await hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.email, email));
    // Invalidate code and token
    await cache.del(tokenKey);
    await cache.del(`fp:code:${email.toLowerCase()}`);

    // Notify user (no password included)
    const loginUrl = 'https://www.dintrafikskolahlm.se/login';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Lösenordet har ändrats</h2>
        <p>Hej,</p>
        <p>Ditt lösenord har just ändrats för ditt konto hos Din Trafikskola Hässleholm.</p>
        <p>Om det inte var du som gjorde ändringen, kontakta oss omedelbart.</p>
        <div style="text-align:center; margin: 24px 0;">
          <a href="${loginUrl}" style="background: #dc2626; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700;">Logga in</a>
        </div>
        <p style="font-size: 12px; color: #6b7280;">Du kan alltid logga in här: <a href="${loginUrl}">${loginUrl}</a></p>
      </div>`;
    await sendEmail({
      to: email,
      subject: 'Lösenord ändrat',
      html,
      messageType: 'general',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kunde inte ändra lösenord' }, { status: 500 });
  }
}


