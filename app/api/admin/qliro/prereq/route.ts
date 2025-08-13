import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';

async function checkUrlReachable(url: string, method: 'HEAD' | 'GET' | 'OPTIONS' = 'HEAD'): Promise<{ ok: boolean; status?: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { method, signal: controller.signal } as RequestInit);
    clearTimeout(timeout);
    return { ok: res.status >= 200 && res.status < 500, status: res.status };
  } catch {
    return { ok: false };
  }
}

export async function GET(_request: NextRequest) {
  const auth = await requireAuthAPI();
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  try {
    const rows = await db.select().from(siteSettings);
    const map = rows.reduce((acc: Record<string, string>, s: any) => { acc[s.key] = s.value || ''; return acc; }, {} as Record<string, string>);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const prodEnabled = map['qliro_prod_enabled'] === 'true';
    const sandboxEnabled = map['qliro_enabled'] === 'true';
    const useProd = prodEnabled;
    const apiUrl = useProd ? (map['qliro_prod_api_url'] || 'https://payments.qit.nu') : (map['qliro_dev_api_url'] || 'https://pago.qit.nu');
    const apiKey = useProd ? map['qliro_prod_api_key'] : map['qliro_api_key'];
    const apiSecret = map['qliro_api_secret'] || map['qliro_secret'] || '';

    const checks: Array<{ key: string; label: string; status: 'ok' | 'warn' | 'error'; details?: any }> = [];

    // HTTPS server
    checks.push({
      key: 'https_server',
      label: 'HTTPS-enabled web server',
      status: appUrl.startsWith('https://') ? 'ok' : 'error',
      details: { appUrl }
    });

    // Qliro API URL HTTPS
    checks.push({
      key: 'api_url_https',
      label: 'Qliro API URL uses HTTPS',
      status: apiUrl.startsWith('https://') ? 'ok' : 'error',
      details: { apiUrl }
    });

    // Credentials
    checks.push({
      key: 'credentials',
      label: 'API credentials present (key + secret)',
      status: (apiKey && apiSecret) ? 'ok' : 'error',
      details: { hasApiKey: !!apiKey, hasApiSecret: !!apiSecret, environment: useProd ? 'production' : (sandboxEnabled ? 'sandbox' : 'disabled') }
    });

    // URL definitions
    const termsUrl = appUrl ? `${appUrl}/kopvillkor` : '';
    const integrityUrl = appUrl ? `${appUrl}/integritetspolicy` : '';
    const checkoutPushUrl = appUrl ? `${appUrl}/api/payments/qliro/checkout-push` : '';
    const orderMgmtPushUrl = appUrl ? `${appUrl}/api/payments/qliro/order-management-push` : '';

    if (termsUrl) {
      const r = await checkUrlReachable(termsUrl, 'GET');
      checks.push({ key: 'terms_url', label: 'Terms and conditions URL reachable', status: r.ok ? 'ok' : 'error', details: { termsUrl, status: r.status } });
    }
    if (integrityUrl) {
      const r = await checkUrlReachable(integrityUrl, 'GET');
      checks.push({ key: 'integrity_url', label: 'Integrity policy URL reachable', status: r.ok ? 'ok' : 'warn', details: { integrityUrl, status: r.status } });
    }
    if (checkoutPushUrl) {
      const r = await checkUrlReachable(checkoutPushUrl, 'OPTIONS');
      checks.push({ key: 'checkout_push_url', label: 'MerchantCheckoutStatusPushUrl endpoint reachable', status: r.ok ? 'ok' : 'warn', details: { checkoutPushUrl, status: r.status } });
    }
    if (orderMgmtPushUrl) {
      const r = await checkUrlReachable(orderMgmtPushUrl, 'OPTIONS');
      checks.push({ key: 'order_mgmt_push_url', label: 'MerchantOrderManagementStatusPushUrl endpoint reachable', status: r.ok ? 'ok' : 'warn', details: { orderMgmtPushUrl, status: r.status } });
    }

    // Shopping cart URL and Order confirmation URL are runtime pages; we verify base app URL only
    checks.push({ key: 'shopping_cart_url', label: 'Shopping cart URL (embed page) under HTTPS', status: appUrl.startsWith('https://') ? 'ok' : 'warn', details: { suggested: `${appUrl}/booking/payment/<id>` } });
    checks.push({ key: 'order_confirmation_url', label: 'Order confirmation URL under HTTPS', status: appUrl.startsWith('https://') ? 'ok' : 'warn', details: { suggested: `${appUrl}/dashboard/student/bokningar/<id>` } });

    return NextResponse.json({
      environment: useProd ? 'production' : (sandboxEnabled ? 'sandbox' : 'disabled'),
      appUrl,
      apiUrl,
      checks
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to run prerequisites check';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


