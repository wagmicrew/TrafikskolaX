import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis/client';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ error: 'Saknar data' }, { status: 400 });
    const codeKey = `fp:code:${email.toLowerCase()}`;
    const entry = await cache.get(codeKey);
    if (!entry || entry.code !== code) {
      return NextResponse.json({ success: false, valid: false });
    }
    // Mark verified token (one-time) with short TTL (10 min remaining window)
    const tokenKey = `fp:verified:${email.toLowerCase()}`;
    await cache.set(tokenKey, { ok: true }, 600);
    return NextResponse.json({ success: true, valid: true });
  } catch {
    return NextResponse.json({ error: 'Kunde inte verifiera kod' }, { status: 500 });
  }
}


