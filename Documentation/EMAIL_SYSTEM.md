# Email System Documentation

## Architecture Overview

The email system is built with modularity and reliability in mind, supporting multiple delivery methods and template management.

## Core Components

### 1. EmailService (`lib/email/email-service.ts`)
- Handles template-based email sending
- Processes email triggers
- Manages email delivery

### 2. EnhancedEmailService (`lib/email/enhanced-email-service.ts`)
- Advanced email functionality
- Fallback mechanisms
- Template management
- Error handling and retries

## Email Triggers

| Trigger | Template | Recipient | Description |
|---------|----------|-----------|-------------|
| User Registration | `welcome_email` | New User | Sent after successful registration |
| Booking Confirmation | `booking_confirmation` | Student | Sent when a booking is confirmed |
| 24h Reminder | `booking_reminder` | Student | Sent 24h before scheduled lesson |
| Teacher Assignment | `teacher_assignment` | Teacher | When assigned to a lesson |
| Payment Receipt | `payment_receipt` | Payer | After successful payment |
| Password Reset | `password_reset` | User | When password reset is requested |
| Feedback Request | `feedback_request` | Student | After lesson completion |

## Configuration

### SMTP Settings
```env
SMTP_HOST=mailcluster.loopia.se
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@dintrafikskolahlm.se
SMTP_PASS=your_password_here
FROM_EMAIL=info@dintrafikskolahlm.se
FROM_NAME="Din Trafikskola HLM"
```

### SendGrid (Alternative)
```env
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM=info@dintrafikskolahlm.se
SENDGRID_FROM_NAME="Din Trafikskola HLM"
```

## Template System

### Template Variables
Templates use double curly braces for variables:
- `{{user.firstName}}` - User's first name
- `{{user.lastName}}` - User's last name
- `{{user.email}}` - User's email
- `{{booking.id}}` - Booking reference
- `{{booking.date}}` - Formatted booking date
- `{{lesson.type}}` - Type of lesson
- `{{lesson.duration}}` - Duration in minutes

### Example Template
```html
<div>
  <h2>Hej {{user.firstName}}!</h2>
  <p>Tack för din bokning hos oss.</p>
  <p><strong>Detaljer:</strong></p>
  <ul>
    <li>Typ: {{lesson.type}}</li>
    <li>Datum: {{booking.date}}</li>
    <li>Tid: {{booking.time}}</li>
  </ul>
</div>
```

## Error Handling

The system implements several layers of error handling:
1. **Primary Method**: Tries the configured primary email method (SMTP/SendGrid)
2. **Fallback Method**: If primary fails, tries the alternative method
3. **Internal Storage**: If all else fails, stores email in the database for manual sending

## Monitoring

All email operations are logged with the following details:
- Timestamp
- Recipient
- Subject
- Status (sent/failed)
- Error details (if any)
- Delivery method used

## Testing

To test the email system:
1. Use the test endpoint: `POST /api/email/test`
2. Check logs for delivery status
3. Verify in the email template admin for rendering
