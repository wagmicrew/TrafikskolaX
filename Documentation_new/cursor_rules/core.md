# Cursor Rules — Core

- Prefer existing patterns; do not invent new stacks
- Validate all API inputs (Zod); return consistent JSON errors
- Use Drizzle ORM and transactions for multi-step DB ops
- Cache site_settings reads; avoid N+1 DB queries
- Use requireAuthAPI with minimal scope (student/teacher/admin)
- Do not bypass components/ui primitives; keep UI consistent
- Keep endpoints idempotent where applicable; use proper HTTP verbs
- Log minimal PII; avoid logging secrets; use structured logs
- Add indexes for frequently queried columns when adding features
- Tests: add at least minimal integration test for new API routes
- Never commit real secrets in docs/env; use .env.local
