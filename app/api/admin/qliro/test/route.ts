import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { qliroService } from '@/lib/payment/qliro-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const url = new URL(request.url);
    const extended = url.searchParams.get('extended') === '1' || url.searchParams.get('debug') === '1';
    const authTest = url.searchParams.get('authTest') === '1';

    // Enhanced auth test for debugging 401 errors
    if (authTest) {
      console.log("[QLIRO AUTH DEBUG] Starting detailed auth test...")
      
      try {
        // Get current settings
        const settings = await qliroService.getResolvedSettings(true);
        console.log("[QLIRO AUTH DEBUG] Current settings:", {
          enabled: settings.enabled,
          environment: settings.environment,
          hasApiKey: settings.hasApiKey,
          hasApiSecret: settings.hasApiSecret,
          apiUrl: settings.apiUrl,
          apiKeyMasked: settings.apiKeyMasked
        });

        // Test minimal checkout creation
        const testResult = await qliroService.createCheckout({
          amount: 100, // 100 SEK
          reference: `auth_test_${Date.now()}`,
          description: 'Authorization test order',
          returnUrl: `${settings.publicUrl}/test-return`
        });
        
        return NextResponse.json({
          success: true,
          message: 'Qliro authorization test PASSED!',
          testResult,
          settings: {
            enabled: settings.enabled,
            environment: settings.environment,
            hasApiKey: settings.hasApiKey,
            hasApiSecret: settings.hasApiSecret,
            apiKeyMasked: settings.apiKeyMasked,
            apiUrl: settings.apiUrl
          }
        });
      } catch (authError: any) {
        console.error("[QLIRO AUTH DEBUG] Auth test failed:", authError);
        return NextResponse.json({
          success: false,
          error: `Authorization test failed: ${authError.message}`,
          details: {
            status: authError.status,
            statusText: authError.statusText,
            body: authError.body,
            errorType: authError.constructor?.name
          },
          rawError: {
            message: authError.message,
            stack: authError.stack?.split('\n').slice(0, 5)
          }
        });
      }
    }

    const result = await qliroService.testConnection({ extended });
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    console.error('Qliro test error:', error);
    return NextResponse.json({ success: false, message: 'Failed to test Qliro connection' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const status = await qliroService.getTestStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Qliro test status error:', error);
    return NextResponse.json({ passed: false, lastTestDate: null }, { status: 500 });
  }
}
