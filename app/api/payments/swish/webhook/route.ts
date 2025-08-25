import { NextRequest, NextResponse } from 'next/server';
import { bookingInvoiceService } from '@/lib/services/booking-invoice-service';

export const dynamic = 'force-dynamic';

// POST /api/payments/swish/webhook - Handle Swish payment confirmations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Swish webhook received:', body);

    // Extract relevant data from Swish webhook
    const {
      id, // Swish payment reference
      payeePaymentReference,
      amount,
      currency,
      status,
      datePaid,
      errorCode,
      errorMessage
    } = body;

    // Handle different payment statuses
    if (status === 'PAID') {
      try {
        // Find invoice by payment reference and mark as paid
        // In a real implementation, you would have a mapping between payment references and invoice IDs
        // For now, we'll assume the payeePaymentReference contains the invoice number

        const paymentReference = payeePaymentReference || id;
        const paymentAmount = parseFloat(amount);

        const result = await bookingInvoiceService.handlePaymentConfirmation(
          paymentReference,
          'swish',
          paymentAmount
        );

        console.log('Swish payment processed successfully:', result);

        return NextResponse.json({
          status: 'success',
          message: 'Payment processed successfully'
        });

      } catch (error) {
        console.error('Error processing Swish payment:', error);
        return NextResponse.json({
          status: 'error',
          message: 'Failed to process payment'
        }, { status: 500 });
      }

    } else if (status === 'DECLINED' || status === 'ERROR') {
      console.log(`Swish payment ${status}:`, {
        id,
        errorCode,
        errorMessage
      });

      // Handle declined/error payments
      // You might want to update the invoice status to 'error' and notify the customer

      return NextResponse.json({
        status: 'declined',
        message: 'Payment was declined or failed'
      });

    } else {
      // Handle other statuses (CREATED, etc.)
      console.log(`Swish payment status ${status}:`, body);

      return NextResponse.json({
        status: 'received',
        message: `Payment status: ${status}`
      });
    }

  } catch (error) {
    console.error('Error in Swish webhook:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Webhook processing failed'
    }, { status: 500 });
  }
}
