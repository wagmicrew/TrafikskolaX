# Auth (JWT + Roles)

- Token: 7d expiry; payload includes userId, email, role, firstName, lastName
- Storage: HTTP-only cookie auth-token; client may mirror in localStorage
- Roles: student, teacher, admin
- Server helper: requireAuthAPI(role?) → { success, user?, status, error? }

Contracts
- POST /api/auth/login → { success, token, user }
- POST /api/auth/verify with Authorization: Bearer <token> → { success, user }
- Protect handlers with requireAuthAPI('admin'|'teacher'|'student')

Rules
- Validate input; return consistent JSON errors
- Rate limit: login 5/min
- Keep tokens short-lived; rotate refresh if implemented

Files
- lib/auth/jwt.ts, lib/auth/server-auth.ts
- app/api/auth/login/route.ts, app/api/auth/verify/route.ts
