import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get payment settings
    const settings = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.category, 'payment'));

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

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

    // Determine which environment to use
    const useProduction = process.env.NODE_ENV === 'production' && qliroProdEnabled;
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

    // In production, test connectivity to Qliro API
    if (process.env.NODE_ENV === 'production') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${apiUrl}/health`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'TrafikskolaX/1.0'
          }
        });

        clearTimeout(timeoutId);

        // If we get any response (even 404), the service is reachable
        return NextResponse.json({
          available: true,
          environment: useProduction ? 'production' : 'sandbox',
          apiUrl: apiUrl
        });

      } catch (error) {
        console.error('Qliro connectivity check failed:', error);
        
        return NextResponse.json({
          available: false,
          reason: 'connectivity',
          message: 'Cannot reach Qliro API',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // In development, always return available (will use mock mode if needed)
    return NextResponse.json({
      available: true,
      environment: useProduction ? 'production' : 'sandbox',
      apiUrl: apiUrl,
      mock: process.env.NODE_ENV === 'development'
    });

  } catch (error) {
    console.error('Error checking Qliro status:', error);
    return NextResponse.json({
      available: false,
      reason: 'error',
      message: 'Internal server error'
    }, { status: 500 });
  }
}
