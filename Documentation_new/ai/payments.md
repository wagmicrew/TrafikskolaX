# Payments (Swish + Qliro)

States
- pending → processing → completed | failed | refunded

Swish
- POST /api/payments/swish/qr-code → { qrCode, swishUUID }
- POST /api/payments/swish/callback — provider callback
- Admin approve: /api/admin/bookings/approve-swish

Qliro
- POST /api/payments/qliro/create-checkout → { checkoutUrl, orderId }
- GET /api/payments/qliro/status → { available, environment, apiUrl, ... }
- POST /api/payments/qliro/webhook — updates purchase/payment
- Helpers/admin: test-order, payments (list/create/refund/repay/export), settlements
- Packages: POST /api/packages/purchase → delegates to Qliro if selected

Rules
- Env from site_settings (payment category), not NODE_ENV
- Availability requires valid credentials + live connectivity (HEAD/GET, 5s)
- No mock/fallback URLs; surface errors

Files
- lib/payment/qliro-service.ts, app/api/payments/qliro/*
- app/api/payments/swish/*
