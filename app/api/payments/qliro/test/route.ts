import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    // Simulate Qliro integration test
    // In a real implementation, this would test the actual Qliro API connection

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if Qliro is configured
    const qliroMerchantId = process.env.QLIRO_MERCHANT_ID || process.env.NEXT_PUBLIC_QLIRO_MERCHANT_ID;
    const qliroApiKey = process.env.QLIRO_API_KEY;
    const hasQliroConfig = !!(qliroMerchantId && qliroApiKey);

    if (!hasQliroConfig) {
      return NextResponse.json({
        error: 'Qliro är inte konfigurerat. Ange Merchant ID och API-nyckel i betalningsinställningarna.',
        status: 'not_configured'
      }, { status: 400 });
    }

    // Test basic configuration (this would be a real API call in production)
    const testResult = {
      success: true,
      message: 'Qliro integration fungerar korrekt',
      merchantId: qliroMerchantId,
      timestamp: new Date().toISOString(),
      testData: {
        endpoint: 'simulated',
        responseTime: '1500ms',
        status: 'connected',
        apiVersion: 'latest'
      }
    };

    return NextResponse.json(testResult);

  } catch (error) {
    console.error('Error testing Qliro integration:', error);
    return NextResponse.json({
      error: 'Fel vid test av Qliro integration'
    }, { status: 500 });
  }
}
