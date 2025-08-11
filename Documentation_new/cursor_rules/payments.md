# Cursor Rules — Payments (Swish QR + Qliro Checkout)

Sources
- See `Documentation/QLIRO_IMPLEMENTATION.md` and `Documentation/SWISH_IMPLEMENTATION.md` for full context.

Swish QR Code (build + use)
- Endpoint: POST `/api/payments/swish/qr-code`
  - Input: amount (SEK as number), message, bookingId
  - Output: `{ qrCode: string, swishUUID: string }`
- Data rules
  - Amount must be converted to öre when calling Swish (100.00 SEK → 10000)
  - Use site setting `swish_number` (or env) for payee alias
  - Include `callbackUrl` from settings/env; server handles `/api/payments/swish/callback`
- Behavior
  - On success, return QR code payload to client; do not store raw QR image
  - Admin confirms/declines via `/api/booking/confirm-swish-payment` or dedicated admin route
  - Timeouts: 10s; retry up to 3 on transient failures
  - Validate amount, bookingId; log minimal PII

Qliro Checkout (build + use)
- Endpoint: POST `/api/payments/qliro/create-checkout`
  - Input: amount, bookingId (or reference), customer details as needed
  - Output: `{ checkoutUrl, orderId }` (may also include checkoutId/merchantReference)
- Environment selection
  - Strictly from `site_settings` (category `payment`):
    - Sandbox: `qliro_enabled`, `qliro_api_key`, `qliro_merchant_id`, `qliro_dev_api_url`
    - Production: `qliro_prod_enabled`, `qliro_prod_api_key`, `qliro_prod_merchant_id`, `qliro_prod_api_url`
  - If both enabled, Production wins
- Availability
  - Check via GET `/api/payments/qliro/status` (HEAD/GET to base URL, 5s timeout)
  - Frontend must disable option if `available:false`
- Behavior
  - No mock or fallback URLs
  - Handle webhook at `/api/payments/qliro/webhook` (verify HMAC with `qliro_webhook_secret`)
  - Log minimal PII; surface provider errors; do not guess

Payment Method Matrix (who can use what)
- Guests (not logged in): Swish, Qliro
- Users (logged in): Swish, Qliro, Credits
- Users (Inskrivna/enrolled): Swish, Qliro, Credits, Pay later
  - Pay later constraint: maximum 2 unpaid sessions per user

Enforcement Rules
- Determine user state: guest vs authenticated; if authenticated, check `users.inskriven`
- Credits
  - Validate sufficient credits before acceptance; deduct atomically in transaction
- Pay later
  - Only for `inskriven === true`
  - Count unpaid sessions: bookings with `paymentStatus in ('unpaid','pending')` and not cancelled
  - If count >= 2 → reject with clear error
- Booking confirmation
  - Swish: mark booking `payment_avvaktande` until admin confirm/callback
  - Qliro: on redirect/webhook success → confirmed/paid
  - Credits: immediate confirmed if deduction ok

Client UX Rules
- Always fetch Qliro status; disable option if unavailable; show returned message
- For Swish, present QR and instructions; poll/admin confirmation flow clearly indicated
- If user is inskriven and has <2 unpaid, show Pay later option; otherwise hide/disable with reason

Validation Snippets
```ts
// Pay later eligibility
const unpaidCount = await db.select({ count: sql`count(*)` })
  .from(bookings)
  .where(and(
    eq(bookings.userId, user.id),
    inArray(bookings.paymentStatus, ['unpaid','pending']),
    ne(bookings.status, 'cancelled')
  ));
if (!user.inskriven || unpaidCount.count >= 2) {
  return errorResponse('Pay later not available');
}
```

```ts
// Qliro availability check (client)
const status = await fetch('/api/payments/qliro/status').then(r => r.json());
if (!status.available) disableQliro(status.message);
```

