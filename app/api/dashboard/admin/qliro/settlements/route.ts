import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { qliroService } from '@/lib/payment/qliro-service';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const country = searchParams.get('country') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const currency = searchParams.get('currency') || '';
    const types = searchParams.get('types') || '';
    const statuses = searchParams.get('statuses') || '';

    const path = `/checkout/adminapi/v2/settlements?${new URLSearchParams({
      FromDate: from,
      ToDate: to,
      CountryCode: country,
      PaymentMethodType: paymentMethod,
      CurrencyCode: currency,
      Types: types,
      SettlementStatuses: statuses,
    }).toString()}`;

    const res = await qliroService.adminGet(path);
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}




