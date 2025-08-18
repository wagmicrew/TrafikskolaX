import { NextRequest, NextResponse } from 'next/server';
import { QliroService } from '@/lib/payment/qliro-service';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing Qliro API Connectivity ===');
    
    const qliroService = QliroService.getInstance();
    
    // Test 1: Check if Qliro is enabled
    console.log('1. Checking if Qliro is enabled...');
    const isEnabled = await qliroService.isEnabled();
    console.log(`Qliro enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      return NextResponse.json({
        success: false,
        message: 'Qliro is not enabled in settings',
        tests: {
          enabled: false
        }
      }, { status: 200 });
    }
    
    // Test 2: Basic connection test
    console.log('2. Testing basic connection...');
    const connectionTest = await qliroService.testConnection();
    
    const results = {
      enabled: isEnabled,
      basicConnection: connectionTest
    };
    
    // Test 3: Extended connection test with debug info
    if (connectionTest.success) {
      console.log('3. Testing extended connection...');
      const extendedTest = await qliroService.testConnection({ extended: true });
      results.extendedConnection = extendedTest;
    }
    
    // Test 4: Test order creation with customer data
    if (connectionTest.success) {
      console.log('4. Testing order creation with customer data...');
      try {
        const testOrder = await qliroService.createCheckout({
          amount: 50000, // 500 SEK
          reference: `TEST-API-${Date.now()}`,
          description: 'Test order via API endpoint',
          returnUrl: `${request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se'}/test-return`,
          customerEmail: 'test@trafikskolax.se',
          customerFirstName: 'Test',
          customerLastName: 'User',
          customerPhone: '+46701234567'
        });
        
        results.orderCreation = {
          success: true,
          orderId: testOrder.checkoutId,
          paymentUrl: testOrder.checkoutUrl,
          merchantReference: testOrder.merchantReference
        };
        
        console.log('✅ Order creation successful');
      } catch (error) {
        results.orderCreation = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error
        };
        console.log('❌ Order creation failed:', error);
      }
    }
    
    const overallSuccess = connectionTest.success && (results.orderCreation?.success !== false);
    
    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? 'All Qliro tests passed' : 'Some Qliro tests failed',
      timestamp: new Date().toISOString(),
      tests: results
    }, { status: 200 });
    
  } catch (error) {
    console.error('Qliro test endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Test endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'basic' } = body;
    
    const qliroService = QliroService.getInstance();
    
    if (testType === 'connection') {
      const result = await qliroService.testConnection({ extended: true });
      return NextResponse.json(result);
    }
    
    if (testType === 'order') {
      const { amount = 10000, reference, customerData } = body;
      
      const testOrder = await qliroService.createCheckout({
        amount,
        reference: reference || `TEST-POST-${Date.now()}`,
        description: 'Test order via POST',
        returnUrl: `${request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se'}/test-return`,
        ...customerData
      });
      
      return NextResponse.json({
        success: true,
        order: testOrder
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid test type'
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    }, { status: 500 });
  }
}
