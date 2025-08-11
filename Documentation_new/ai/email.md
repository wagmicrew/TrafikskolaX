# Email System

Core
- EnhancedEmailService (primary), EmailService (legacy), UniversalMailer
- Templates, Triggers, Receivers in DB

Template variables (common)
- user: firstName, lastName, email, fullName
- booking: id, scheduledDate, startTime, endTime, lessonTypeName, totalPrice, swishUUID
- system: schoolName, appUrl, currentYear/currentDate

Key triggers
- new_user, user_login, forgot_password, new_booking, moved_booking, cancelled_booking, booking_reminder, credits_reminder, payment_reminder, payment_confirmed/declined, teacher_daily_bookings, teacher_feedback_reminder, new_password

Admin endpoints
- GET/PUT /api/admin/email-templates
- POST /api/admin/email-templates/preview
- POST /api/admin/email-test

Notes
- Always fetch schoolname from DB (site_settings)
- Fallback order: SendGrid → SMTP → internal message
- Log minimal PII; store failures as internal messages
