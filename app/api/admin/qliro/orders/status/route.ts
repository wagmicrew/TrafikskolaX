import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { qliroOrders, siteSettings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { qliroService } from '@/lib/payment/qliro-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId') || undefined;
  const qliroOrderId = searchParams.get('qliroOrderId') || undefined;
  const refresh = searchParams.get('refresh') === '1';

  if (!bookingId && !qliroOrderId) {
    return NextResponse.json({ error: 'bookingId or qliroOrderId is required' }, { status: 400 });
  }

  try {
    // Load one record by either key
    const where = qliroOrderId
      ? eq(qliroOrders.qliroOrderId, qliroOrderId)
      : eq(qliroOrders.bookingId, bookingId as string);

    const rows = await db.select().from(qliroOrders).where(where).limit(1);
    const record = rows[0] || null;
    if (!record) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    let latest: any = null;
    if (refresh) {
      try {
        latest = await qliroService.getOrder(record.qliroOrderId as string);
        const status = latest?.Status || latest?.status || 'pending';
        const link = latest?.PaymentLink || null;
        await qliroService.updateOrderStatus(record.qliroOrderId as string, status, link || undefined);
      } catch (e: any) {
        latest = { error: e?.message || 'Failed to fetch order from provider' };
      }
    }

    // Config diagnostics
    let config: any = {};
    try {
      const settingsRows = await db.select().from(siteSettings);
      const map = settingsRows.reduce((acc: Record<string, string>, s: any) => { acc[s.key] = s.value || ''; return acc; }, {} as Record<string, string>);
      const publicUrl = map['public_app_url'] || map['site_public_url'] || map['app_url'] || '';
      const publicUrlHttps = publicUrl.startsWith('https://');
      const webhookSecretPresent = !!(map['qliro_webhook_secret'] || map['qliro_secret']);
      config = {
        environment: map['qliro_prod_enabled'] === 'true' ? 'production' : 'sandbox',
        publicUrl,
        publicUrlHttps,
        webhookSecretPresent,
      };
    } catch {}

    return NextResponse.json({
      order: record,
      latest,
      config,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}


