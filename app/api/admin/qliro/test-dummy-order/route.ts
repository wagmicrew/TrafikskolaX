import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { qliroService } from '@/lib/payment/qliro-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    console.log('[Qliro Test] Creating dummy order for PaymentOptions testing...');

    // Create a dummy order
    const dummyOrderData = {
      amount: 1,
      reference: `test-dummy-${Date.now()}`,
      description: 'Dummy order for PaymentOptions testing',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/qliro-test`,
      customerEmail: 'test@example.com',
      customerFirstName: 'Test',
      customerLastName: 'User'
    };

    console.log('[Qliro Test] Creating checkout with:', JSON.stringify(dummyOrderData, null, 2));

    const checkoutResult = await qliroService.createCheckout(dummyOrderData);
    
    console.log('[Qliro Test] Checkout created successfully:', checkoutResult);

    // Now get PaymentOptions for the created order
    try {
      const paymentOptions = await qliroService.getPaymentOptions(checkoutResult.checkoutId);
      console.log('[Qliro Test] PaymentOptions retrieved:', JSON.stringify(paymentOptions, null, 2));
      
      const availablePaymentMethods = paymentOptions.PaymentMethods?.map((pm: any) => ({
        paymentId: pm.PaymentId,
        name: pm.Name,
        groupName: pm.GroupName,
        isSwish: pm.Name?.toLowerCase().includes('swish')
      })) || [];
      
      console.log('[Qliro Test] Available payment methods:', availablePaymentMethods);
      
      const nonSwishMethods = availablePaymentMethods.filter((pm: any) => !pm.isSwish);
      console.log('[Qliro Test] Non-Swish payment methods:', nonSwishMethods);

      return NextResponse.json({
        success: true,
        checkoutResult,
        paymentOptions,
        availablePaymentMethods,
        nonSwishMethods,
        testOrderId: checkoutResult.checkoutId
      });
    } catch (paymentOptionsError) {
      console.error('[Qliro Test] Failed to get PaymentOptions:', paymentOptionsError);
      return NextResponse.json({
        success: true,
        checkoutResult,
        paymentOptionsError: paymentOptionsError instanceof Error ? paymentOptionsError.message : 'Unknown error',
        testOrderId: checkoutResult.checkoutId
      });
    }

  } catch (error) {
    console.error('[Qliro Test] Error creating dummy order:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create dummy order',
      details: error
    }, { status: 500 });
  }
}
