import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';

// Use unified service for checkout creation to avoid divergence
import { qliroService } from '@/lib/payment/qliro-service';

export async function POST(request: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const bodyJson = await request.json().catch(() => ({}));
    let { customer = {} } = bodyJson || {};

    // Load site public URL from settings
    const rows = await db.select().from(siteSettings);
    const map = rows.reduce((acc: Record<string, string>, s: any) => { acc[s.key] = s.value || ''; return acc; }, {} as Record<string, string>);

    const publicUrl = map['public_app_url'] || map['site_public_url'] || map['app_url'] || process.env.NEXT_PUBLIC_APP_URL || '';
    if (!publicUrl || !publicUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'Public https URL not configured (public_app_url)' }, { status: 400 });
    }

    const reference = `test_${Date.now()}`;
    // Use unified service to create a real checkout using configured env/credentials
    const checkout = await qliroService.createCheckout({
      amount: 1,
      reference,
      description: 'Admin test order',
      returnUrl: `${publicUrl}/dashboard/admin/settings/qliro?test=${reference}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      personalNumber: customer.personalNumber,
    });
    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkoutUrl,
      orderId: checkout.checkoutId,
      merchantReference: checkout.merchantReference,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create test order', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}




