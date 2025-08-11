# Booking

Flows
- Student/Guest: select lesson → slot → confirm → pay (Swish/Qliro/credits)
- Admin/Teacher: can create for student; emails to selected student

Key statuses
- Booking: temp, on_hold, booked, confirmed, cancelled
- Payment: pending, paid/confirmed, failed

Temp holds
- temp expires after ~10 minutes; must be excluded from availability after threshold

Endpoints (core)
- GET /api/booking/available-slots — slots for a date; includes temp/on_hold filtering
- GET /api/bookings/available-slots — alternative endpoint (duplicate; prefer unify)
- POST /api/booking/create — create booking (student)
- PUT /api/booking/confirm — confirm payment method
- PUT /api/booking/update-student — assign student (admin/teacher)
- POST /api/booking/confirm-swish-payment — admin confirms/declines Swish
- POST /api/booking/cleanup(-expired) — maintenance

Admin/Teacher
- POST /api/admin/booking/confirmation — finalize booking
- POST /api/admin/bookings/create-for-student — create with correct email routing (admin)
- POST /api/teacher/bookings/create-for-student — same for teacher

Notes
- Always validate slot against active bookings and non-expired temps
- On confirmation, send relevant email triggers
