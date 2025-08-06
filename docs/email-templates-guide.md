# Email Templates Guide

This guide provides an overview of the email template system in TrafikskolaX, including how to create, modify, and manage email templates.

## Table of Contents
- [Overview](#overview)
- [Template Variables](#template-variables)
- [Available Triggers](#available-triggers)
- [Template Management](#template-management)
- [Best Practices](#best-practices)
- [Testing Templates](#testing-templates)

## Overview

The email template system allows administrators to customize the content of automated emails sent by the system. Templates are stored in the database and can be managed through the admin interface.

Each template is associated with a specific trigger event (e.g., new booking, payment confirmation) and can be sent to different receiver types (student, teacher, admin).

## Template Variables

Templates support dynamic variables that are replaced with actual values when the email is sent. Here are the available variables:

### User Variables
- `{{user.firstName}}` - User's first name
- `{{user.lastName}}` - User's last name
- `{{user.fullName}}` - User's full name (first + last)
- `{{user.email}}` - User's email address
- `{{user.role}}` - User's role (student/teacher/admin)

### Booking Variables
- `{{booking.id}}` - Booking ID
- `{{booking.scheduledDate}}` - Scheduled date of the booking
- `{{booking.startTime}}` - Start time of the booking
- `{{booking.endTime}}` - End time of the booking
- `{{booking.lessonTypeName}}` - Name of the lesson type
- `{{booking.totalPrice}}` - Total price of the booking
- `{{booking.paymentMethod}}` - Payment method used
- `{{booking.swishUUID}}` - Swish payment reference (if applicable)

### Teacher Variables
- `{{teacher.firstName}}` - Teacher's first name
- `{{teacher.lastName}}` - Teacher's last name
- `{{teacher.fullName}}` - Teacher's full name (first + last)
- `{{teacher.email}}` - Teacher's email address

### System Variables
- `{{appUrl}}` - Base URL of the application
- `{{schoolName}}` - Name of the driving school
- `{{schoolEmail}}` - School's contact email
- `{{adminEmail}}` - Administrator's email
- `{{currentYear}}` - Current year
- `{{currentDate}}` - Current date

## Available Triggers

### User Related
- `new_user` - Sent when a new user registers
- `user_login` - Sent after successful login
- `forgot_password` - Sent when password reset is requested
- `new_password` - Sent when a new password is set

### Booking Related
- `new_booking` - Sent when a new booking is created
- `moved_booking` - Sent when a booking is rescheduled
- `cancelled_booking` - Sent when a booking is cancelled
- `booking_reminder` - Sent as a reminder before a booking
- `booking_confirmed` - Sent when a booking is confirmed

### Payment Related
- `payment_reminder` - Sent as a payment reminder
- `payment_confirmation_request` - Sent to request payment confirmation
- `payment_confirmed` - Sent when payment is confirmed
- `payment_declined` - Sent when payment is declined

### Teacher Related
- `teacher_daily_bookings` - Daily summary of bookings for teachers
- `teacher_feedback_reminder` - Reminder to provide feedback

### System Related
- `feedback_received` - Sent when feedback is received
- `awaiting_school_confirmation` - Sent when action requires school confirmation
- `pending_school_confirmation` - Sent when waiting for school confirmation

## Template Management

### Creating a New Template

1. Navigate to the Email Templates section in the admin dashboard
2. Click "Create New Template"
3. Select the trigger type
4. Enter a subject and HTML content
5. Select the receiver types
6. Save the template

### Editing a Template

1. Find the template in the list
2. Click the edit icon
3. Make your changes
4. Use the preview feature to see how it will look
5. Save your changes

## Best Practices

1. **Always include the school name** using `{{schoolName}}`
2. **Use the app URL** for links back to the application: `{{appUrl}}/path`
3. **Keep it responsive** - Emails should look good on mobile devices
4. **Test thoroughly** - Use the preview and test features before making templates active
5. **Use the branding colors** - Maintain consistency with the school's brand
6. **Include clear calls-to-action** - Make it obvious what the recipient should do next

## Testing Templates

1. Use the preview feature in the admin interface
2. Send test emails to verify the formatting
3. Check how templates look on different email clients
4. Verify all links work correctly
5. Test with different data scenarios

## HTML Guidelines

When creating or modifying template HTML:

1. Use inline styles for maximum compatibility
2. Keep the HTML structure simple and semantic
3. Use tables for layout (better email client support)
4. Include a text version for accessibility
5. Keep the total width under 600px
6. Use web-safe fonts with fallbacks

## Troubleshooting

### Common Issues

1. **Images not displaying**
   - Ensure image URLs are absolute
   - Check image hosting permissions

2. **Styling not applied**
   - Use inline styles instead of external stylesheets
   - Test in multiple email clients

3. **Variables not replaced**
   - Check for typos in variable names
   - Ensure required context is provided when sending

4. **Emails marked as spam**
   - Avoid spam trigger words
   - Ensure proper SPF/DKIM records are set up
   - Include an unsubscribe link

For additional help, contact the development team or refer to the system documentation.
