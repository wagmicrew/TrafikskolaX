# Qliro Payment Flow (Refactored Rules)

This document captures the exact rules and contracts used for the Qliro integration after the refactor. It is intended for developers and AI engines working on TrafikskolaX.

## Source of Truth
- All configuration is read exclusively from the `site_settings` table with `category = 'payment'`.
- Ignore `NODE_ENV` for environment decisions.

## Environment Selection
- Production if `qliro_prod_enabled === 'true'`.
- Sandbox if `qliro_enabled === 'true'` and production is not enabled.
- If both flags are true, production wins.

## Required Settings Keys
- Sandbox:
  - `qliro_enabled` → must be `'true'` to enable
  - `qliro_api_key`
  - `qliro_merchant_id`
  - `qliro_dev_api_url` (defaults to `https://playground.qliro.com` if empty)
- Production:
  - `qliro_prod_enabled` → must be `'true'` to enable
  - `qliro_prod_api_key`
  - `qliro_prod_merchant_id`
  - `qliro_prod_api_url` (defaults to `https://api.qliro.com` if empty)
- Webhooks:
  - `qliro_webhook_secret` (fallback: `qliro_secret`)

## Connectivity and Availability
- Availability requires both:
  1) Valid credentials for the selected environment, and
  2) Live connectivity to the configured API base URL.
- Status endpoint performs a live reachability check:
  - HEAD to the base URL; if it fails, GET the base URL.
  - 5-second timeout using AbortController.
  - Returns JSON with `{ available, environment, apiUrl, reason?, message? }`.
- If unreachable or misconfigured, Qliro is reported as unavailable.

## No Mock or Fallback Modes
- All mock and dev fallback behaviors have been removed.
- If the API is unreachable or not configured, the system must surface errors and mark Qliro as unavailable. No mock checkout URLs are ever returned.

## Backend Contracts
- Create Checkout: `POST /api/payments/qliro/create-checkout`
  - Validates payload and calls `qliroService.createCheckout(...)`.
  - Requires service to be enabled via `site_settings`; otherwise 503.
  - Response: `{ success: true, checkoutId, checkoutUrl, merchantReference }`.
- Status: `GET /api/payments/qliro/status`
  - Returns live availability based on configuration and connectivity.
- Purchase Flow: `POST /api/packages/purchase`
  - Creates a pending purchase row and delegates Qliro checkout creation to the service.
  - Stores `pricePaid` as a string (decimal) with two fractional digits.

## Frontend Rules
- Always fetch `/api/payments/qliro/status` and disable Qliro option if `available` is false.
- Show the `message` provided by the status API when disabled.
- Open the returned `checkoutUrl` from the backend (no local construction).

## Security
- Webhook signature verification uses HMAC SHA-256 with the secret from `site_settings`.
- Do not log sensitive keys or secrets. Use minimal PII in logs.

## Testing Tips
- Ensure necessary `site_settings` keys are present for the selected environment.
- Verify status endpoint returns `available: true` before exposing Qliro in UI.
- Try creating a checkout and confirm a real `checkoutUrl` is returned. Any errors must surface without fallback.

## Files of Interest
- `lib/payment/qliro-service.ts` (single source for env selection and API calls)
- `app/api/payments/qliro/status/route.ts`
- `app/api/payments/qliro/create-checkout/route.ts`
- `app/api/packages/purchase/route.ts`
- `app/packages-store/packages-store-client.tsx`
