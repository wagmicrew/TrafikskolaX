# Payment Hub System Documentation

## Overview

The Payment Hub System is a comprehensive, multi-method payment solution for TrafikskolaX driving school, providing customers with intuitive payment options while giving administrators full control and visibility over all transactions.

## Architecture

### Core Components

```
📁 app/
├── 📁 betalhubben/[id]/
│   └── page.tsx                 # Main customer payment hub
├── 📁 dashboard/admin/payments/
│   ├── 📁 qliro/
│   │   ├── page.tsx            # Admin payment hub dashboard
│   │   └── payment-hub-client.tsx # Unified admin client component
│   └── 📁 swish/
│       └── page.tsx            # Swish-specific admin interface
├── 📁 api/
│   ├── 📁 admin/payments/
│   │   ├── stats/route.ts      # Payment statistics API
│   │   └── transactions/route.ts # Transaction history API
│   └── 📁 payments/
│       ├── 📁 swish/
│       │   ├── qr-code/route.ts # QR code generation
│       │   └── callback/route.ts # Payment callbacks
│       └── 📁 qliro/
│           ├── create-checkout/route.ts # Checkout creation
│           └── webhook/route.ts # Payment webhooks
└── 📁 components/
    ├── SwishQR.tsx             # Enhanced QR component
    ├── booking/
    │   ├── swish-payment-dialog.tsx # Swish payment modal
    │   └── qliro-payment-dialog.tsx # Qliro payment modal
    └── ui/                     # UI components
```

## Payment Methods

### 1. Swish Payment 💳

**Features:**
- QR code generation with fallback options
- Real-time payment confirmation
- Admin approval workflow
- Mobile-optimized experience

**Flow:**
```
Customer selects Swish → QR code generated → Customer scans → Payment processed → Admin confirmation → Booking confirmed
```

**Implementation Details:**
```typescript
// QR Code Generation
const requestPayload = {
  payee: swishNumber,
  amount: amount.toString(),
  message: message,
  format: 'png',
  size: 300
};
```

### 2. Qliro Checkout 💳

**Features:**
- Multiple payment options (cards, invoice, installments)
- Secure hosted checkout
- Automatic payment processing
- Webhook-based confirmations

**Supported Payment Types:**
- 💳 Credit/Debit Cards
- 📱 Swish
- 📄 Invoice (faktura)
- 🔄 Installment payments (delbetalning)

**Flow:**
```
Customer selects Qliro → Checkout URL generated → Redirect to Qliro → Payment completed → Webhook callback → Booking confirmed
```

### 3. Credits System 💰

**Features:**
- Prepaid lesson credits
- Instant activation
- Balance tracking
- Automatic deduction

**Implementation:**
```typescript
// Credit payment process
const response = await fetch(`/api/invoices/${invoice.id}/pay-with-credits`, {
  method: 'POST',
  body: JSON.stringify({ creditId: availableCredit.lessonTypeId })
});
```

### 4. Pay on Location 🏢

**Features:**
- Flexible payment at lesson time
- Multiple payment options (cash, card, Swish)
- No upfront commitment
- Automatic booking marking

## UI Components

### Payment Hub (Customer View)

**Location:** `app/betalhubben/[id]/page.tsx`

**Features:**
- 🎨 Beautiful gradient design with animations
- 📱 Mobile-responsive layout
- ⏰ Payment timers for guest users
- 🎯 Clear payment method selection
- 📊 Invoice details display
- 🚨 Urgency alerts for upcoming classes

**Enhanced Payment Cards:**
```typescript
// Each payment method card includes:
- Animated icons with hover effects
- Payment information display
- Feature highlights with emojis
- Gradient backgrounds and borders
- Scale animations on interaction
```

### Admin Dashboard

**Location:** `app/dashboard/admin/payments/qliro/payment-hub-client.tsx`

**Features:**
- 📊 Real-time payment statistics
- 🔍 Transaction filtering and search
- 📋 Comprehensive transaction history
- 🎛️ Quick action buttons
- 📈 Payment method performance tracking
- 💰 Revenue analytics

## API Endpoints

### Payment Statistics API

**Endpoint:** `GET /api/admin/payments/stats`

**Response:**
```typescript
{
  totalRevenue: number;
  todayRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  swishTransactions: number;
  qliroTransactions: number;
  creditTransactions: number;
}
```

### Transaction History API

**Endpoint:** `GET /api/admin/payments/transactions`

**Query Parameters:**
- `limit` - Number of transactions (default: 50)
- `method` - Filter by payment method
- `status` - Filter by payment status

**Response:**
```typescript
{
  transactions: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    method: 'swish' | 'qliro' | 'credit' | 'location';
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    createdAt: string;
    lessonType?: string;
    scheduledDate?: string;
  }>;
  total: number;
  hasMore: boolean;
}
```

### Swish QR Code API

**Endpoint:** `POST /api/payments/swish/qr-code`

**Request:**
```typescript
{
  payee: string;        // Swish number
  amount: string;       // Amount in SEK
  message: string;      // Payment message
  format?: 'png' | 'jpg' | 'svg';
  size?: number;        // QR code size
}
```

**Response:** QR code image blob

### Qliro Checkout API

**Endpoint:** `POST /api/payments/qliro/create-checkout`

**Request:**
```typescript
{
  invoiceId: string;
  amount: number;
  description: string;
  reference: string;
}
```

**Response:**
```typescript
{
  checkoutUrl: string;
  checkoutId: string;
  merchantReference: string;
}
```

## Configuration

### Environment Variables

```env
# Swish Configuration
NEXT_PUBLIC_SWISH_NUMBER=1234567890

# Qliro Configuration
QLIRO_ENVIRONMENT=sandbox|production
QLIRO_MERCHANT_ID=your_merchant_id
QLIRO_API_KEY=your_api_key
QLIRO_API_SECRET=your_api_secret
QLIRO_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Database Settings

Payment methods are configured through `site_settings` table:

```sql
-- Qliro Settings
INSERT INTO site_settings (key, value, category) VALUES
('qliro_enabled', 'true', 'payment'),
('qliro_prod_enabled', 'true', 'payment'),
('qliro_api_key', 'your_sandbox_key', 'payment'),
('qliro_prod_api_key', 'your_production_key', 'payment');

-- Payment Method Availability
INSERT INTO site_settings (key, value, category) VALUES
('qliro_payment_invoice', 'true', 'payment'),
('qliro_payment_creditcards', 'true', 'payment'),
('qliro_payment_swish', 'false', 'payment');
```

## Security Features

### 1. Input Validation
- All payment amounts are validated server-side
- SQL injection prevention through parameterized queries
- XSS protection with proper sanitization

### 2. Authentication
- JWT-based admin authentication
- Public invoice access through secure tokens
- Guest user payment restrictions

### 3. Payment Security
- HTTPS-only payment processing
- Secure webhook signature verification
- PCI compliance for card payments (Qliro handles)

### 4. Rate Limiting
- API rate limiting on payment endpoints
- QR code generation throttling
- Checkout creation limits

## Payment Flows

### Customer Journey

1. **Invoice Generation**
   - Booking created → Invoice generated → Email sent with payment link

2. **Payment Selection**
   - Customer visits payment hub → Selects preferred method

3. **Payment Processing**
   - Swish: QR code displayed → Customer scans → Admin confirms
   - Qliro: Redirect to checkout → Payment completed → Automatic confirmation
   - Credits: Instant deduction → Immediate confirmation
   - Location: Booking marked for on-site payment

4. **Confirmation**
   - Payment confirmed → Booking status updated → Confirmation email sent

### Admin Workflow

1. **Dashboard Monitoring**
   - View real-time statistics
   - Monitor pending payments
   - Track payment methods performance

2. **Payment Management**
   - Approve Swish payments
   - View transaction details
   - Handle failed payments
   - Generate reports

## Error Handling

### Payment Errors

```typescript
// Comprehensive error handling
try {
  const response = await fetch('/api/payments/swish/qr-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Payment failed');
  }

  const result = await response.json();
  // Success handling
} catch (error) {
  // Error handling with user-friendly messages
  toast.error('Betalning misslyckades: ' + error.message);
}
```

### Webhook Processing

```typescript
// Secure webhook handling
export async function POST(request: Request) {
  const signature = request.headers.get('qliro-signature');
  const body = await request.text();

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(signature, body);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process payment update
  const paymentData = JSON.parse(body);
  await updatePaymentStatus(paymentData);

  return NextResponse.json({ received: true });
}
```

## Testing

### Payment Method Testing

```typescript
// Swish Testing
const testSwishPayment = async () => {
  const response = await fetch('/api/payments/swish/qr-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payee: '1234567890',
      amount: '500',
      message: 'Test payment'
    })
  });
  return response.ok;
};

// Qliro Testing
const testQliroConnection = async () => {
  const response = await fetch('/api/payments/qliro/status');
  const status = await response.json();
  return status.available;
};
```

### Test Cards (Qliro)

```typescript
// Success Card
const successCard = {
  number: '4103210000000002',
  expiry: '1230',
  cvc: '123'
};

// Failed Card
const failedCard = {
  number: '4103210000000003',
  expiry: '1230',
  cvc: '123'
};
```

## Troubleshooting

### Common Issues

#### QR Code Not Generating
```typescript
// Check Swish configuration
const checkSwishConfig = async () => {
  const response = await fetch('/api/admin/settings');
  const settings = await response.json();

  if (!settings.swish_number) {
    console.error('Swish number not configured');
  }
};
```

#### Qliro Checkout Failing
```typescript
// Verify Qliro settings
const checkQliroConfig = async () => {
  const response = await fetch('/api/payments/qliro/status');
  const status = await response.json();

  console.log('Qliro Status:', status);
  // Check: available, environment, apiUrl
};
```

#### Payment Webhooks Not Working
```typescript
// Test webhook endpoint
const testWebhook = async () => {
  const testPayload = {
    orderId: 'test-order-123',
    status: 'completed',
    amount: 50000 // in öre
  };

  const response = await fetch('/api/payments/qliro/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'qliro-signature': generateTestSignature(testPayload)
    },
    body: JSON.stringify(testPayload)
  });

  return response.ok;
};
```

## Performance Optimization

### Caching Strategies

```typescript
// Settings caching (5 minutes)
private settingsCacheDuration = 5 * 60 * 1000;

// Payment statistics caching
const CACHE_KEY = 'payment_stats';
const CACHE_DURATION = 60000; // 1 minute
```

### Database Optimization

```sql
-- Optimized transaction queries
CREATE INDEX idx_invoices_status_created ON invoices(status, created_at);
CREATE INDEX idx_invoices_payment_method ON invoices(payment_method);
CREATE INDEX idx_bookings_payment_method ON bookings(paymentMethod);
```

## Monitoring & Analytics

### Payment Metrics

```typescript
interface PaymentMetrics {
  conversionRate: number;      // Payments completed / Payments started
  averagePaymentTime: number;  // Average time to complete payment
  paymentMethodUsage: Record<string, number>; // Usage by method
  failureRate: number;         // Failed payments / Total attempts
  revenueByMethod: Record<string, number>;
}
```

### Admin Alerts

```typescript
// Payment failure alerts
const checkPaymentFailures = async () => {
  const response = await fetch('/api/admin/payments/stats');
  const stats = await response.json();

  if (stats.pendingPayments > 10) {
    // Send admin alert
    await sendAdminAlert('High number of pending payments');
  }
};
```

## Future Enhancements

### Planned Features

1. **Payment Analytics Dashboard**
   - Advanced reporting
   - Customer payment behavior analysis
   - Revenue forecasting

2. **Mobile Payment Optimization**
   - Mobile-specific payment flows
   - Apple Pay / Google Pay integration
   - NFC payment support

3. **Subscription Management**
   - Recurring payment setup
   - Automatic renewal handling
   - Subscription analytics

4. **Multi-Currency Support**
   - International payment processing
   - Currency conversion
   - Exchange rate management

5. **Advanced Fraud Detection**
   - AI-powered fraud detection
   - Risk scoring
   - Automated blocking

## Support & Maintenance

### Regular Tasks

1. **Daily Monitoring**
   - Check payment statistics
   - Monitor failed payments
   - Review pending transactions

2. **Weekly Maintenance**
   - Clear old QR codes
   - Archive completed transactions
   - Update payment method configurations

3. **Monthly Reporting**
   - Generate payment reports
   - Analyze payment trends
   - Review system performance

### Contact Information

For technical support and maintenance:
- Development Team: dev@trafikskolax.com
- Payment Provider Support: Qliro and Swish documentation
- System Monitoring: Integrated logging and error tracking

---

## Quick Reference

### Most Used Endpoints
- `GET /betalhubben/{id}` - Customer payment hub
- `POST /api/payments/swish/qr-code` - Generate QR code
- `POST /api/payments/qliro/create-checkout` - Create Qliro checkout
- `GET /api/admin/payments/stats` - Payment statistics
- `GET /api/admin/payments/transactions` - Transaction history

### Key Components
- `SwishPaymentDialog` - Swish payment modal
- `QliroPaymentDialog` - Qliro payment modal
- `PaymentHubClient` - Admin dashboard
- `SwishQR` - QR code component

### Configuration Files
- Environment variables in `.env.local`
- Database settings in `site_settings` table
- Payment templates in email system
- Webhook endpoints in payment providers

This documentation provides comprehensive coverage of the Payment Hub System. For specific implementation details, refer to the inline code comments and API documentation.
