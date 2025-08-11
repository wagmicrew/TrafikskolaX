## Qliro Checkout Integration (Overview)

This document summarizes our Qliro integration in rule-based chunks for quick onboarding and AI tooling. For the official API, see the Qliro docs: [Qliro API Docs](https://developers.qliro.com/docs/api).

### Environment and Settings
- Read settings from `site_settings` with `category = 'payment'`.
- Enable flags:
  - `qliro_prod_enabled = 'true'` → Production
  - `qliro_enabled = 'true'` → Sandbox
- Keys per environment (single source of truth):
  - Production: `qliro_prod_api_key`, `qliro_prod_merchant_id`, `qliro_prod_api_url`
  - Sandbox: `qliro_api_key`, `qliro_merchant_id`, `qliro_dev_api_url` (defaults to `https://playground.qliro.com` if missing)
- Webhook secret: `qliro_webhook_secret` (fallback: `qliro_secret`)
- If both flags are enabled, Production is selected.

### Service
- File: `lib/payment/qliro-service.ts`
- Responsibilities:
  - Load and cache settings (5 min)
  - `isEnabled()` and `getEnvironment()` helpers
  - `createCheckout({ amount, reference, description, returnUrl, customer... })`
    - Builds request payload per Qliro
    - Calls `POST {apiUrl}/checkout/merchantapi/Orders`
    - Returns `{ checkoutId, checkoutUrl, merchantReference }`
  - No mock or fallback modes. Errors are propagated to the caller.

### Routes
- Create checkout: `POST /api/payments/qliro/create-checkout`
  - Validates payload, checks `qliroService.isEnabled()`, invokes `createCheckout`
  - Returns `{ checkoutUrl, checkoutId }`

- Status check: `GET /api/payments/qliro/status`
  - Performs live reachability check to the configured API URL (HEAD, then GET if needed) with a 5s timeout.
  - Returns `{ available, environment, apiUrl, reason?, message? }`.

- Webhook: `POST /api/payments/qliro/webhook`
  - Receives order updates from Qliro
  - Verifies and updates purchase/payment state
  - Credits user where appropriate

### Packages Purchase Flow
- Client: `app/packages-store/packages-store-client.tsx`
  - User selects a package and payment method (Swish or Qliro)
  - Calls `POST /api/packages/purchase` with `{ packageId, paymentMethod }`
  - For Swish: opens a Swish QR dialog; finalization: `POST /api/packages/confirm-payment`
  - For Qliro: receives `checkoutUrl` and opens `QliroPaymentDialog`

- API: `app/api/packages/purchase/route.ts`
  - Validates user and package, creates `package_purchases` row (pending)
  - For Swish: returns deep link/QR data; confirmation handled by admin or webhook
  - For Qliro: builds checkout via environment-specific base URL and returns `checkoutUrl`

### Availability and Connectivity Rules
- Environment selection comes strictly from `site_settings` (ignore `NODE_ENV`).
- Availability requires BOTH valid credentials AND live connectivity to the chosen API URL.
- Connectivity check: HTTP HEAD to base URL; falls back to GET if HEAD fails; 5s timeout.
- If unreachable or misconfigured, the API responds with `available: false` and `reason` (e.g., `connectivity`, `configuration`).
- Frontend must disable Qliro payment option when `available` is false and show the returned message.
- No mock or dev fallback is allowed anywhere in the flow.

### Data Model (relevant tables)
- `packages`, `package_contents`, `package_purchases`, `user_credits`, `site_settings`

### Notes
- Treat driving lessons as 0% VAT in price mapping.
- Always log payment events via `lib/logging/logger.ts` for traceability.
- Use minimal PII in logs.

References: [Qliro API Documentation](https://developers.qliro.com/docs/api)

# Qliro One Integration

## Configuration
```env
QLIRO_ENVIRONMENT=sandbox|production
QLIRO_MERCHANT_ID=your_merchant_id
QLIRO_API_KEY=your_api_key
QLIRO_SECRET=your_shared_secret
QLIRO_CALLBACK_URL=https://api.yourdomain.com/api/payments/qliro/callback
```

## Core Implementation

### 1. Create Payment Order
```typescript
// Example payload
const order = {
  merchant: {
    merchantId: process.env.QLIRO_MERCHANT_ID,
    subscriptionId: '1234567890',
    callbackUrl: process.env.QLIRO_CALLBACK_URL
  },
  order: {
    orderId: 'ORDER123',
    currency: 'SEK',
    totalAmount: 9900, // 99 SEK in öre
    items: [
      {
        id: 'LESSON-1',
        name: 'Driving Lesson',
        quantity: 1,
        unitPrice: 9900,
        vatRate: 0
      }
    ]
  },
  customer: {
    email: 'customer@example.com',
    phoneNumber: '+46701234567',
    firstName: 'John',
    lastName: 'Doe'
  }
};
```

### 2. Handle Callback
```typescript
// Example callback handler
app.post('/api/payments/qliro/callback', async (req, res) => {
  const signature = req.headers['qliro-signature'];
  const payload = req.body;
  
  // Verify signature
  const isValid = verifySignature(payload, signature);
  
  if (isValid) {
    const { orderId, status } = payload;
    
    // Update order status in database
    await db.order.update({
      where: { orderId },
      data: { status }
    });
    
    res.status(200).json({ received: true });
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

## Security
- **API Key**: Sent in `X-API-Key` header
- **Signature**: HMAC-SHA256 of payload
- **HTTPS**: Required for all endpoints

## Testing
- **Test Cards**:
  - 4103 2100 0000 0002 (success)
  - 4103 2100 0000 0003 (failed)
- **Test Environment**: https://api.qlironline.com/v1/orders

## Error Handling
- **400**: Invalid request
- **401**: Unauthorized
- **403**: Forbidden
- **429**: Rate limited
- **5xx**: Server error
