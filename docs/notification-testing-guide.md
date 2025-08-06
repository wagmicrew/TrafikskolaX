# Notification Testing Guide

This guide provides a comprehensive test plan for verifying all email notification flows in the TrafikskolaX system.

## Test Environment Setup

1. **Test Email Configuration**
   - Set up a test email account (e.g., Gmail test account)
   - Configure the application to use this account for sending test emails
   - Ensure the test account can receive emails

2. **Test Data Preparation**
   - Create test users (student, teacher, admin)
   - Create test lesson types
   - Set up test bookings with various statuses

## Test Cases

### 1. User Registration Flow
- [ ] **New User Registration**
  - Register a new student account
  - Verify welcome email is received with correct content
  - Check all placeholders are replaced correctly
  - Verify email is sent to the correct recipient

### 2. Booking Flow
- [ ] **New Booking**
  - Create a new booking as a student
  - Verify booking confirmation email is sent
  - Check all booking details are correct in the email
  - Verify email is sent to both student and admin

- [ ] **Booking Rescheduled**
  - Reschedule an existing booking
  - Verify booking updated email is sent
  - Check old and new booking times are shown correctly

- [ ] **Booking Cancelled**
  - Cancel an existing booking
  - Verify cancellation email is sent
  - Check refund/credit information if applicable

### 3. Payment Flow
- [ ] **Payment Confirmation**
  - Process a successful payment
  - Verify payment confirmation email is sent
  - Check payment details are correct

- [ ] **Payment Reminder**
  - Trigger payment reminder for an unpaid booking
  - Verify reminder email is sent
  - Check payment link is included and working

- [ ] **Payment Declined**
  - Simulate a declined payment
  - Verify payment declined email is sent
  - Check retry instructions are clear

### 4. Reminder Emails
- [ ] **Booking Reminder**
  - Set a booking for tomorrow
  - Run the booking reminder cron job
  - Verify reminder email is sent 24 hours before

- [ ] **Credit Reminder**
  - Create a user with unused credits
  - Run the credit reminder cron job
  - Verify reminder email is sent

### 5. Teacher Notifications
- [ ] **Daily Bookings Summary**
  - Create bookings for a teacher
  - Run the daily summary cron job
  - Verify email contains all bookings for the day
  - Check formatting of the bookings list

- [ ] **Feedback Reminder**
  - Complete a lesson without feedback
  - Run the feedback reminder cron job
  - Verify reminder email is sent to the teacher

### 6. System Notifications
- [ ] **System Maintenance**
  - Schedule system maintenance
  - Verify notification is sent to all users
  - Check maintenance window is clearly stated

## Automated Testing

### Running the Test Scripts

1. **Test Daily Summary**
   ```bash
   # Set test teacher email (replace with actual test email)
   export TEST_TEACHER_EMAIL=teacher@example.com
   
   # Run the test script
   npx tsx scripts/test-daily-summary.ts
   ```

2. **Test All Cron Jobs**
   ```bash
   # Test booking reminders
   npx tsx scripts/email-cron-jobs.ts booking-reminders
   
   # Test teacher daily bookings
   npx tsx scripts/email-cron-jobs.ts teacher-daily-bookings
   
   # Test credit reminders
   npx tsx scripts/email-cron-jobs.ts credit-reminders
   
   # Test feedback reminders
   npx tsx scripts/email-cron-jobs.ts feedback-reminders
   ```

## Manual Testing

1. **Email Client Testing**
   - Test in different email clients (Gmail, Outlook, Apple Mail)
   - Verify responsive design on mobile and desktop
   - Check that all links work correctly

2. **Template Rendering**
   - Test with different email content lengths
   - Verify special characters are displayed correctly
   - Check that images load properly

## Expected Results

For each test case, verify:
- Email is delivered to the correct recipient(s)
- Email subject and content are correct
- All placeholders are replaced with actual values
- Links work as expected
- Email renders correctly in different email clients
- Email is properly formatted on mobile devices

## Troubleshooting

- **Emails not sending**: Check email service configuration and logs
- **Missing data in emails**: Verify template variables are being passed correctly
- **Formatting issues**: Check email client compatibility and HTML/CSS validation
- **Missing emails**: Check spam/junk folders and email server logs

## Additional Notes

- Keep test data separate from production data
- Use email testing services like Mailtrap for development
- Monitor email delivery rates and bounce rates in production
- Regularly update email templates based on user feedback
