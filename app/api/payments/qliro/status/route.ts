import { NextRequest, NextResponse } from 'next/server';
import { getPaymentSettingsCached } from '@/lib/settings/payment-settings';

export async function GET(request: NextRequest) {
  try {
    const settingsMap = await getPaymentSettingsCached(60_000);

    // Check if Qliro is enabled
    const qliroEnabled = settingsMap.qliro_enabled === 'true';
    const qliroProdEnabled = settingsMap.qliro_prod_enabled === 'true';
    
    if (!qliroEnabled && !qliroProdEnabled) {
      return NextResponse.json({
        available: false,
        reason: 'disabled',
        message: 'Qliro is not enabled in settings'
      });
    }

    // Determine which environment to use strictly from site_settings
    const useProduction = qliroProdEnabled;
    const apiUrl = useProduction 
      ? (settingsMap.qliro_prod_api_url || 'https://api.qliro.com')
      : (settingsMap.qliro_dev_api_url || 'https://playground.qliro.com');
    
    const apiKey = useProduction ? settingsMap.qliro_prod_api_key : settingsMap.qliro_api_key;
    const merchantId = useProduction ? settingsMap.qliro_prod_merchant_id : settingsMap.qliro_merchant_id;

    if (!apiKey || !merchantId) {
      return NextResponse.json({
        available: false,
        reason: 'configuration',
        message: 'Qliro API credentials not configured'
      });
    }

    // Always perform a reachability check against the configured FQDN
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // First attempt a HEAD request to the base URL
      let ok = false;
      try {
        const headResp = await fetch(apiUrl, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow' as RequestRedirect,
          headers: { 'User-Agent': 'TrafikskolaX/1.0' }
        } as RequestInit);
        ok = !!headResp;
      } catch {
        ok = false;
      }

      // If HEAD fails, fall back to GET '/'
      if (!ok) {
        try {
          const getResp = await fetch(apiUrl, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'follow' as RequestRedirect,
            headers: { 'User-Agent': 'TrafikskolaX/1.0' }
          } as RequestInit);
          ok = !!getResp;
        } catch {
          ok = false;
        }
      }

      clearTimeout(timeoutId);

      if (!ok) {
        // Do not hard-block checkout; mark as available but warn
        return NextResponse.json({
          available: true,
          reason: 'connectivity',
          message: 'Cannot reach Qliro API',
          environment: useProduction ? 'production' : 'sandbox',
          apiUrl
        });
      }

      return NextResponse.json({
        available: true,
        environment: useProduction ? 'production' : 'sandbox',
        apiUrl
      });
    } catch (error) {
      console.error('Qliro connectivity check failed:', error);
      return NextResponse.json({
        available: true,
        reason: 'connectivity',
        message: 'Cannot reach Qliro API',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error checking Qliro status:', error);
    return NextResponse.json({
      available: false,
      reason: 'error',
      message: 'Internal server error'
    }, { status: 500 });
  }
}
