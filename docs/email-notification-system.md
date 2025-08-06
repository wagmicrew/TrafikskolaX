# Email Notification System

## Overview
The Email Notification System is a flexible and extensible solution for sending automated emails based on various triggers within the TrafikskolaX platform. It supports customizable email templates, multiple recipients, and dynamic content generation.

## Architecture

### Core Components

1. **Email Templates**
   - Stored in the database with HTML content and subject
   - Can include dynamic variables (e.g., `{{user.firstName}}`, `{{booking.id}}`)
   - Associated with specific trigger types

2. **Triggers**
   - Events that cause an email to be sent
   - Examples: user registration, booking confirmation, payment received
   - Defined in the `email_triggers` table

3. **Receivers**
   - Define who receives the email
   - Types: user, admin, specific email addresses
   - Can be customized per template

4. **Notification Service**
   - Handles the logic for sending emails
   - Processes templates and replaces variables
   - Manages email delivery

## How It Works

1. **Trigger Event**
   - An event occurs in the system (e.g., new booking)
   - The system identifies the appropriate email template(s) for the event

2. **Template Processing**
   - The template is retrieved from the database
   - Dynamic variables are replaced with actual values
   - The email content is generated

3. **Email Delivery**
   - The email is sent to all specified recipients
   - Delivery status is logged for monitoring

## Adding a New Email Trigger

1. **Define the Trigger**
   Add a new entry to the `EmailTriggerType` enum in `schema.ts`:
   ```typescript
   export enum EmailTriggerType {
     // ... existing triggers
     NEW_TRIGGER = 'new_trigger',
   }
   ```

2. **Update the Notification Service**
   Add a new method to handle the trigger in `notification-service.ts`:
   ```typescript
   async onNewTrigger(data: NewTriggerData) {
     return this.sendEmail({
       triggerType: 'new_trigger',
       userId: data.userId,
       // Include any additional data needed for the template
       customData: {
         // ...
       }
     });
   }
   ```

3. **Create a Template**
   Use the admin interface to create a new email template for the trigger.

4. **Trigger the Email**
   Call the appropriate method from your application code:
   ```typescript
   await notificationService.onNewTrigger({
     userId: '123',
     // ...
   });
   ```

## Template Variables

### Available in All Templates
- `{{appUrl}}` - The base URL of the application
- `{{schoolName}}` - The name of the driving school
- `{{currentYear}}` - The current year

### User Variables
- `{{user.id}}` - User's ID
- `{{user.firstName}}` - User's first name
- `{{user.lastName}}` - User's last name
- `{{user.fullName}}` - User's full name
- `{{user.email}}` - User's email address
- `{{user.phone}}` - User's phone number

### Booking Variables
- `{{booking.id}}` - Booking ID
- `{{booking.scheduledDate}}` - Date of the booking
- `{{booking.startTime}}` - Start time
- `{{booking.endTime}}` - End time
- `{{booking.status}}` - Booking status
- `{{booking.paymentStatus}}` - Payment status
- `{{booking.totalPrice}}` - Total price
- `{{booking.lessonTypeName}}` - Type of lesson
- `{{booking.teacherName}}` - Assigned teacher's name

### Payment Variables
- `{{payment.id}}` - Payment ID
- `{{payment.amount}}` - Payment amount
- `{{payment.currency}}` - Currency code (e.g., SEK)
- `{{payment.status}}` - Payment status
- `{{payment.method}}` - Payment method
- `{{payment.reference}}` - Payment reference
- `{{payment.paidAt}}` - When the payment was made

## Testing

### Previewing Emails
1. Go to the email template in the admin interface
2. Click the "Preview" tab
3. The system will generate a preview using test data

### Sending Test Emails
1. Use the "Send Test" button in the admin interface
2. Enter a recipient email address
3. The email will be sent with the current template content

## Best Practices

1. **Keep Templates Simple**
   - Use responsive HTML
   - Test in multiple email clients
   - Keep the design clean and professional

2. **Handle Errors Gracefully**
   - Log all email sending attempts
   - Provide fallback content for missing variables
   - Implement retry logic for failed sends

3. **Security**
   - Sanitize all user-generated content in templates
   - Use HTTPS for all links
   - Don't include sensitive information in emails

## Troubleshooting

### Common Issues

**Emails not sending**
- Check the server logs for errors
- Verify that the email service is properly configured
- Check that the template is active

**Variables not being replaced**
- Make sure the variable names match exactly
- Check that the data is being passed correctly
- Verify that the variable exists in the template

**Poor email deliverability**
- Check your email service provider's reputation
- Ensure your SPF, DKIM, and DMARC records are set up correctly
- Avoid using spam trigger words in your subject and content

## Future Improvements

1. **Email Analytics**
   - Track open and click rates
   - Monitor bounce rates
   - Generate reports

2. **A/B Testing**
   - Test different subject lines
   - Compare different templates
   - Optimize send times

3. **Advanced Personalization**
   - User segmentation
   - Behavior-based triggers
   - Dynamic content blocks
