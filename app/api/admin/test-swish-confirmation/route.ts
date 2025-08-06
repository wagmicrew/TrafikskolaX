import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Test the Swish payment notification function
    const { EmailService } = await import('@/lib/email/email-service');
    
    const testContext = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      },
      booking: {
        id: 'test-booking-id',
        scheduledDate: '2024-01-15',
        startTime: '10:00',
        endTime: '11:00',
        lessonTypeName: 'Körlektion',
        totalPrice: '500',
        paymentMethod: 'swish',
        swishUUID: 'test-swish-uuid'
      }
    };

    // Test sending the Swish payment verification email
    const result = await EmailService.sendTriggeredEmail('swish_payment_verification', testContext);

    return NextResponse.json({ 
      success: result,
      message: result ? 'Swish payment verification email sent successfully' : 'Failed to send Swish payment verification email',
      context: testContext
    });

  } catch (error) {
    console.error('Error testing Swish confirmation:', error);
    return NextResponse.json({ 
      error: 'Failed to test Swish confirmation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 