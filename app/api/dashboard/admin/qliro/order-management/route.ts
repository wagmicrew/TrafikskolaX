import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { qliroService } from '@/lib/payment/qliro-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

    const body = await request.json();
    const { action, payload } = body as { action: 'updateReference' | 'cancelOrder' | 'updateItems' | 'markShipped' | 'clearTemp'; payload: any };

    switch (action) {
      case 'updateReference': {
        const res = await qliroService.adminPost('/checkout/adminapi/v2/updatemerchantreference', payload);
        return NextResponse.json({ success: true, res });
      }
      case 'cancelOrder': {
        const res = await qliroService.adminPost('/checkout/adminapi/v2/cancelorder', payload);
        return NextResponse.json({ success: true, res });
      }
      case 'updateItems': {
        const res = await qliroService.adminPost('/checkout/adminapi/v2/updateitems', payload);
        return NextResponse.json({ success: true, res });
      }
      case 'markShipped': {
        const res = await qliroService.adminPost('/checkout/adminapi/v2/markitemsasshipped', payload);
        return NextResponse.json({ success: true, res });
      }
      case 'clearTemp': {
        // Manually clear temp bookings and unpaid package purchases older than 10 minutes
        const cronToken = process.env.CRON_SECRET || 'your-secure-cron-token';
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/booking/cleanup-expired`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${cronToken}` },
        });
        const data = await res.json();
        return NextResponse.json({ success: res.ok, data });
      }
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process order management action' }, { status: 500 });
  }
}


