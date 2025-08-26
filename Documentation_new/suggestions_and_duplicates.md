# Suggestions and Duplicates

## Database Table Duplicates

**lesson_types vs teori_lesson_types**
- Both tables define lesson types with similar structure (name, description, price, duration)
- `lesson_types`: Used by regular driving lesson bookings system
- `teori_lesson_types`: Used by theory sessions and supervisor training
- **Recommendation**: Consider consolidating into unified `lesson_types` table with `category` field ('driving', 'theory', 'supervisor')
- **Impact**: Would reduce schema complexity and maintenance overhead

## API Endpoint Duplicates

- available-slots endpoints: /api/booking/available-slots and /api/bookings/available-slots → keep one canonical path (prefer /api/booking/available-slots) and deprecate the other
- Payment/QLIRO admin endpoints overlap (create/refund/repay/test/export scattered) → expose via a single admin/qliro/payments controller with sub-actions

API hygiene
- Add rate limiting middleware to auth and booking create endpoints
- Standardize success/error envelopes across all routes
- Ensure all admin endpoints enforce role checks via requireAuthAPI('admin')

Performance (app)
- Add DB indexes: bookings(userId), bookings(scheduledDate), bookings(status, scheduledDate)
- Cache site_settings reads (Redis or in-memory with TTL) for payment/email checks
- Use SELECT column lists; avoid select * in hot paths
- Collapse multiple sequential DB reads into joins for booking pages

Build/runtime
- Enable Next.js SWC minify and concurrent features; consider Turbopack for dev
- Reduce server bundle size by moving pure client libs to dynamic import or client-only
- Mark static route segments as dynamic = 'force-static' where applicable

Email
- Add preview/test UI if missing; ensure logs searchable by trigger and userId
- Enforce template variable checks at save-time

Payments
- Pre-flight Qliro status on server boot and cache availability for 60s to avoid repeated HEAD requests
- Swish: centralize callback handling with robust validation and logging

DX
- Create npm scripts for: db:generate, db:migrate, email:test, bookings:cleanup
- Add smoke tests for top 10 endpoints (login, available-slots, booking create/confirm, qliro status, swish qr)
