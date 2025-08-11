import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from '@/lib/redis/client';
import { hash } from 'bcryptjs';
import { EmailService } from '@/lib/email/email-service';

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

    // Notify user
    await EmailService.sendTriggeredEmail('new_password', {
      user: { id: '', email, firstName: '', lastName: '', role: 'student' as any },
      customData: {},
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Kunde inte ändra lösenord' }, { status: 500 });
  }
}


