import { qliroService } from '@/lib/payment/qliro-service';

export const dynamic = 'force-dynamic';

export default async function QliroStartPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;

  // Create (or reuse) checkout based on reference
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const ref = String(reference || '');
  const payload: any = {};
  if (ref.startsWith('booking_')) {
    payload.bookingId = ref.slice('booking_'.length);
  } else if (ref.startsWith('package_')) {
    payload.packagePurchaseId = ref.slice('package_'.length);
  } else if (ref.startsWith('handledar_')) {
    payload.handledarBookingId = ref.slice('handledar_'.length);
  } else {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center p-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Ogiltig referens</h1>
          <p className="text-gray-600">Kunde inte tolka referensen: {ref}</p>
        </div>
      </div>
    );
  }
  const createRes = await fetch(`${baseUrl}/api/payments/qliro/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center p-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Kunde inte starta Qliro-checkout</h1>
          <p className="text-gray-600">{err?.error || 'Något gick fel.'}</p>
        </div>
      </div>
    );
  }

  const { checkoutId } = await createRes.json();

  // Fetch order data including the HTML snippet
  const order = await qliroService.getOrder(checkoutId);
  const snippet = order?.OrderHtmlSnippet || '';

  // Render snippet directly
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Qliro Checkout</h1>
      <div dangerouslySetInnerHTML={{ __html: snippet }} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.q1Ready = function() {
              if (window.q1 && window.q1.onPaymentDeclined) {
                window.q1.onPaymentDeclined(function (reason, message) {
                  console.warn('Qliro payment declined:', reason, message);
                });
              }
            };
          `
        }}
      />
    </div>
  );
}




