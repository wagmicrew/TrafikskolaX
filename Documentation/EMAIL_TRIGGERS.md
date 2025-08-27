# Email Triggers Documentation

This document provides a comprehensive overview of all email triggers in the TrafikskolaX system, including where they are triggered, what templates they use, and who receives them.

## Overview

The email system uses a template-based approach where email triggers are fired from various parts of the application, and the actual email content is defined in email templates that can be customized through the admin interface.

## Email Trigger Types

### 1. User Registration & Authentication

#### `new_user`
- **Description**: Sent when a new user registers
- **Location**: `app/api/auth/register/route.ts`
- **Template**: `new_user`
- **Recipients**: The newly registered user
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.registrationDate`

#### `forgot_password`
- **Description**: Sent when user requests password reset
- **Location**: `app/api/auth/forgot-password/route.ts`
- **Template**: `forgot_password`
- **Recipients**: User requesting password reset
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.resetToken`, `customData.resetUrl`

#### `new_password`
- **Description**: Sent when password is changed/reset
- **Location**: `app/api/auth/reset-password/route.ts`
- **Template**: `new_password`
- **Recipients**: User whose password was changed
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`

### 2. Booking Management

#### `new_booking`
- **Description**: Sent when a new booking is created
- **Location**: `app/api/booking/create/route.ts`, `lib/email/notification-service.ts`
- **Template**: `new_booking`
- **Recipients**: The student who made the booking
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.needsPayment`, `customData.paymentDeadline`

#### `booking_confirmed`
- **Description**: Sent when a booking is confirmed
- **Location**: `app/api/booking/confirm/route.ts`, `lib/email/notification-service.ts`
- **Template**: `booking_confirmed`
- **Recipients**: The student whose booking was confirmed
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `teacher.firstName`, `teacher.lastName` (if assigned)

#### `moved_booking`
- **Description**: Sent when a booking is rescheduled
- **Location**: Booking update endpoints
- **Template**: `moved_booking`
- **Recipients**: The student whose booking was moved
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.oldDate`, `customData.oldTime`

#### `cancelled_booking`
- **Description**: Sent when a booking is cancelled
- **Location**: Booking cancellation endpoints
- **Template**: `cancelled_booking`
- **Recipients**: The student whose booking was cancelled
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.cancellationReason`

#### `booking_reminder`
- **Description**: Sent as reminder before booking (day before)
- **Location**: Cron job service (`lib/email/email-cron-service.ts`)
- **Template**: `booking_reminder`
- **Recipients**: Students with bookings tomorrow
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`

### 3. Payment Management

#### `payment_reminder`
- **Description**: Sent to remind about unpaid bookings
- **Location**: `lib/email/notification-service.ts`, cron jobs
- **Template**: `payment_reminder`
- **Recipients**: Students with unpaid bookings
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.paymentDeadline`

#### `payment_confirmation_request`
- **Description**: Sent to admin when student clicks "I have paid"
- **Location**: `app/api/bookings/[id]/payment-confirmation/route.ts`
- **Template**: `payment_confirmation_request`
- **Recipients**: Admin users
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email` (student)
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `admin.email`

#### `payment_confirmed`
- **Description**: Sent to student when payment is confirmed
- **Location**: Payment confirmation endpoints
- **Template**: `payment_confirmed`
- **Recipients**: The student whose payment was confirmed
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.amount`, `customData.paymentDate`, `customData.itemName`, `customData.itemDescription`, `customData.itemDate`, `customData.itemTime`

#### `payment_declined`
- **Description**: Sent to student when payment is declined
- **Location**: Payment decline endpoints
- **Template**: `payment_declined`
- **Recipients**: The student whose payment was declined
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.declinedReason`

### 4. Admin Confirmations

#### `admin_confirmation_ok`
- **Description**: Sent to student when admin confirms payment is OK
- **Location**: Admin payment confirmation endpoints
- **Template**: `admin_confirmation_ok`
- **Recipients**: The student whose payment was confirmed by admin
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.confirmationDate`, `customData.confirmationType`, `customData.adminMessage`

#### `admin_confirmation_not_ok`
- **Description**: Sent to student when admin rejects payment
- **Location**: Admin payment rejection endpoints
- **Template**: `admin_confirmation_not_ok`
- **Recipients**: The student whose payment was rejected by admin
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.confirmationDate`, `customData.confirmationType`, `customData.adminMessage`, `customData.rejectionReason`

#### `admin_booking_confirmed`
- **Description**: Sent to student when admin confirms a booking
- **Location**: Admin booking confirmation endpoints
- **Template**: `admin_booking_confirmed`
- **Recipients**: The student whose booking was confirmed by admin
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `teacher.firstName`, `teacher.lastName` (if assigned)
  - `customData.confirmationDate`, `customData.confirmedBy`, `customData.adminMessage`

#### `admin_payment_ok`
- **Description**: Sent to student when admin approves payment
- **Location**: Admin payment approval endpoints
- **Template**: `admin_payment_ok`
- **Recipients**: The student whose payment was approved by admin
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.paymentDate`, `customData.paymentStatus`, `customData.adminMessage`

### 5. Handledar (Supervisor) Management

#### `handledar_registered`
- **Description**: Sent when a new handledar registers
- **Location**: Handledar registration endpoints
- **Template**: `handledar_registered`
- **Recipients**: The newly registered handledar
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.registrationDate`

#### `handledar_course_reminder`
- **Description**: Sent to participants day before handledar course
- **Location**: Cron job service (`lib/email/notification-service.ts`)
- **Template**: `handledar_course_reminder`
- **Recipients**: Handledar course participants
- **Context Variables**:
  - `customData.sessionTitle`, `customData.sessionDate`, `customData.sessionTime`, `customData.sessionLocation`, `customData.reminderType`

#### `handledar_booking_confirmed`
- **Description**: Sent when handledar booking is confirmed
- **Location**: Handledar booking endpoints
- **Template**: `handledar_booking_confirmed`
- **Recipients**: The handledar student
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`

#### `handledar_payment_reminder`
- **Description**: Sent to remind handledar about payment
- **Location**: Handledar payment endpoints
- **Template**: `handledar_payment_reminder`
- **Recipients**: Handledar students with unpaid sessions
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`

### 6. Lesson Reminders

#### `driving_lesson_reminder`
- **Description**: Sent to students day before driving lesson
- **Location**: Cron job service (`lib/email/notification-service.ts`)
- **Template**: `driving_lesson_reminder`
- **Recipients**: Students with driving lessons tomorrow
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `teacher.firstName`, `teacher.lastName` (if assigned)
  - `customData.reminderType`

### 7. Reviews and Feedback

#### `new_review`
- **Description**: Sent when a new review is submitted
- **Location**: Review submission endpoints
- **Template**: `new_review`
- **Recipients**: Admin users (to notify about new review)
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email` (student who left review)
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `teacher.firstName`, `teacher.lastName` (if assigned)
  - `customData.reviewId`, `customData.reviewDate`, `customData.reviewMessage`

#### `feedback_received`
- **Description**: Sent when feedback is received
- **Location**: Feedback submission endpoints
- **Template**: `feedback_received`
- **Recipients**: Admin users
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.feedbackType`, `customData.feedbackMessage`

### 8. Enrollment

#### `inskrivningsmail`
- **Description**: Sent when a student gets enrolled (inskriven)
- **Location**: `app/api/admin/users/skriv-in/route.ts`
- **Template**: `inskrivningsmail`
- **Recipients**: The enrolled student
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.enrollmentDate`, `customData.enrolledBy`

### 9. Administrative

#### `teacher_daily_bookings`
- **Description**: Daily summary of bookings sent to teachers
- **Location**: `lib/email/notification-service.ts`
- **Template**: `teacher_daily_bookings`
- **Recipients**: Teacher users
- **Context Variables**:
  - `customData.date`, `customData.bookingCount`, `customData.bookingDetails[]`

#### `user_login`
- **Description**: Sent when user logs in (security notification)
- **Location**: Login endpoints
- **Template**: `user_login`
- **Recipients**: The user who logged in
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.loginDate`, `customData.loginIp`

### 10. Swish & Payment Verification

#### `swish_payment_verification`
- **Description**: Sent for Swish payment verification
- **Location**: Swish payment endpoints
- **Template**: `swish_payment_verification`
- **Recipients**: Admin users
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `booking.id`, `booking.scheduledDate`, `booking.startTime`, `booking.endTime`, `booking.lessonTypeName`, `booking.totalPrice`
  - `customData.swishReference`

### 11. Session Management

#### `teori_session_request`
- **Description**: Sent when student requests teori session
- **Location**: Teori session request endpoints
- **Template**: `teori_session_request`
- **Recipients**: Admin users
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.requestedDate`, `customData.sessionType`

### 12. Package Management

#### `package_payment_reminder`
- **Description**: Sent to remind about package payment
- **Location**: Package payment endpoints
- **Template**: `package_payment_reminder`
- **Recipients**: Students with unpaid packages
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.packageName`, `customData.packagePrice`, `customData.paymentDeadline`

#### `credits_reminder`
- **Description**: Sent to remind about available credits
- **Location**: Credit management endpoints
- **Template**: `credits_reminder`
- **Recipients**: Students with expiring credits
- **Context Variables**:
  - `user.firstName`, `user.lastName`, `user.email`
  - `customData.creditsAmount`, `customData.expiryDate`

## Email Template Variables

All email templates support these system variables:

- `{{appUrl}}` - Application URL
- `{{schoolName}}` - School name from settings
- `{{schoolEmail}}` - School email from settings
- `{{schoolPhone}}` - School phone from settings
- `{{adminEmail}}` - Admin email from settings
- `{{currentYear}}` - Current year
- `{{currentDate}}` - Current date (Swedish format)

## Trigger Implementation Status

✅ **Implemented Triggers:**
- `new_user`
- `forgot_password`
- `new_booking`
- `booking_confirmed`
- `payment_reminder`
- `payment_confirmation_request`
- `payment_confirmed`
- `teacher_daily_bookings`
- `inskrivningsmail`
- `admin_confirmation_ok`
- `admin_confirmation_not_ok`
- `admin_booking_confirmed`
- `admin_payment_ok`
- `handledar_registered`
- `handledar_course_reminder`
- `driving_lesson_reminder`
- `new_review`

🔄 **Partially Implemented (need trigger calls in endpoints):**
- `moved_booking`
- `cancelled_booking`
- `payment_declined`
- `feedback_received`
- `user_login`
- `new_password`
- `swish_payment_verification`
- `handledar_booking_confirmed`
- `handledar_payment_reminder`
- `handledar_booking_cancelled`
- `handledar_booking_moved`
- `handledar_student_confirmation`
- `handledar_supervisor_confirmation`
- `handledar_supervisor_payment_request`
- `booking_payment_reminder`
- `credits_reminder`
- `teori_session_request`
- `package_payment_reminder`

## Setup Requirements

1. **Email Templates**: Must be created in the admin interface for each trigger type
2. **Email Receivers**: Must be configured for each template (student, teacher, admin, school, specific_user, supervisor)
3. **SMTP/SendGrid Configuration**: Must be configured in admin settings
4. **Cron Jobs**: Must be set up for reminder emails (driving_lesson_reminder, handledar_course_reminder, booking_reminder)

## Testing

Email templates can be tested through the admin interface using the "Test Email Template" functionality, which sends a test email with mock data to verify the template renders correctly.
