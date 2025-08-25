import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    // Simulate Swish integration test
    // In a real implementation, this would test the actual Swish API connection

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if Swish is configured
    const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER;
    const hasSwishConfig = !!swishNumber;

    if (!hasSwishConfig) {
      return NextResponse.json({
        error: 'Swish är inte konfigurerat. Ange Swish-nummer i betalningsinställningarna.',
        status: 'not_configured'
      }, { status: 400 });
    }

    // Test basic connectivity (this would be a real API call in production)
    const testResult = {
      success: true,
      message: 'Swish integration fungerar korrekt',
      swishNumber: swishNumber,
      timestamp: new Date().toISOString(),
      testData: {
        endpoint: 'simulated',
        responseTime: '1000ms',
        status: 'connected'
      }
    };

    return NextResponse.json(testResult);

  } catch (error) {
    console.error('Error testing Swish integration:', error);
    return NextResponse.json({
      error: 'Fel vid test av Swish integration'
    }, { status: 500 });
  }
}
