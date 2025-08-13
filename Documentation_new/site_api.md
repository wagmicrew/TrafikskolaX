# Site API

Auth
- POST /api/auth/login — login; any guest
- POST /api/auth/verify — verify token; any authenticated client
- POST /api/auth/impersonate — start admin impersonation; admin
- GET  /api/auth/impersonation-status — status; admin

Booking (public/auth)
- GET /api/booking/available-slots — list slots by date (duplicate exists under /api/bookings/...)
- POST /api/booking/create — create booking (student/guest)
- PUT  /api/booking/confirm — confirm payment method (student)
- PUT  /api/booking/update-student — assign student (admin/teacher)
- POST /api/booking/confirm-swish-payment — approve/decline (admin)
- POST /api/booking/cleanup, /cleanup-expired — maintenance

Bookings (scoped)
- GET /api/bookings/[id] — get booking (auth)
- POST /api/bookings/[id]/pay-with-credits — credits (auth)
- GET /api/bookings/available-slots — duplicate alt endpoint (auth)

Admin
- /api/admin/bookings — list/update/bulk ops; approve-swish; clear-all; bulk-delete; bulk-unbook
- /api/admin/users — list, CRUD, credits, delete-with-bookings, avatar
- /api/admin/settings — get/update; email init; add enum values; swish/email helpers
- /api/admin/lesson-content — groups/items CRUD
- /api/admin/slots — list/create/reset/copy
- /api/admin/packages — CRUD and contents
- /api/admin/handledar-* — session management
- /api/admin/migrate/* — migration helpers
- /api/admin/test-* — various testing endpoints

Teacher
- /api/teacher/bookings — list/create-for-student; [id]/plan, [id]/live; unbook
- /api/teacher/lesson-types — list
- /api/teacher/feedback — submit

User
- /api/user/profile — GET/PUT
- /api/user/credits, /user/packages, /user/messages, /user/unpaid-bookings, /users/check-email
- /api/users — GET (admin list)
- /api/messages — GET/POST
- /api/teachers — list
- /api/contact — POST

Payments
- Swish: /api/payments/swish/qr-code, /callback
- Qliro: /api/payments/qliro/create-checkout, /status, /webhook, admin dashboard helpers

Packages
- /api/packages/with-contents, /api/packages/purchase, /api/packages/notify-admin

Payments Admin
- /api/admin/payments/swish/list, /confirm, /decline, /remind — includes type 'order' for package purchases; confirming 'order' adds credits and emails user

Cron
- /api/cron/daily-bookings

Duplicates/Notes
- available-slots: both /api/booking/... and /api/bookings/... (unify)
- Multiple admin Qliro endpoints (create/refund/repay/test/export) — ensure single service path
