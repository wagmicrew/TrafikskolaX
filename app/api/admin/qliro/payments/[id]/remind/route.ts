import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { packagePurchases, users, packages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/sendEmail';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });

    // Load purchase
    const [purchase] = await db.select().from(packagePurchases).where(eq(packagePurchases.id, id)).limit(1);
    if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

    // Resolve user email
    let email = (purchase as any).userEmail as string | undefined;
    if (!email && (purchase as any).userId) {
      const [u] = await db.select().from(users).where(eq(users.id, (purchase as any).userId)).limit(1);
      email = u?.email || undefined;
    }
    if (!email) return NextResponse.json({ error: 'No recipient email found for this order' }, { status: 400 });

    // Try to include package name
    let pkgName: string | undefined;
    if ((purchase as any).packageId) {
      const [pkg] = await db.select().from(packages).where(eq(packages.id, (purchase as any).packageId)).limit(1);
      pkgName = (pkg as any)?.name;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const reference = (purchase as any).paymentReference || (purchase as any).id;
    const body = `
      <p>Hej!</p>
      <p>Du har en obetald beställning${pkgName ? ` för <strong>${pkgName}</strong>` : ''} hos Din Trafikskola.</p>
      <p>Öppna betalningssidan och slutför din betalning här:</p>
      <p><a href="${appUrl}/dashboard?openPayment=${encodeURIComponent(reference)}" style="color:#dc2626">Betala nu</a></p>
      <p>Referens: <code>${reference}</code></p>
    `;

    await sendEmail(email, 'Påminnelse: Slutför din betalning', { title: 'Betalningspåminnelse', body });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Qliro remind error:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}


