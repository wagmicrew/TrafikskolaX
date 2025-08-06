# Email System Documentation for AI

## Overview
The email system uses a template-based approach with dynamic variable replacement. All email operations use the **Neon PostgreSQL** database and **Drizzle ORM**. The system supports multiple delivery methods with fallback mechanisms.

## Core Components

### Email Services
- **EnhancedEmailService** (`lib/email/enhanced-email-service.ts`): Primary email service
- **EmailService** (`lib/email/email-service.ts`): Legacy email service
- **UniversalMailer** (`lib/mailer/universal-mailer.ts`): Email delivery abstraction

### Database Tables
- **email_templates**: Email template definitions
- **email_receivers**: Template recipient configurations
- **email_triggers**: Email trigger definitions
- **site_settings**: Email configuration (schoolname, from_name, etc.)

## Email Template System

### Template Variables
All templates use double curly braces for variable replacement:

```typescript
// User variables
{{user.firstName}}     // User's first name
{{user.lastName}}      // User's last name
{{user.email}}         // User's email address
{{user.fullName}}      // Combined first + last name

// Booking variables
{{booking.id}}         // Booking reference ID
{{booking.scheduledDate}} // Formatted booking date
{{booking.startTime}}  // Lesson start time
{{booking.endTime}}    // Lesson end time
{{booking.lessonTypeName}} // Type of lesson
{{booking.totalPrice}} // Lesson price
{{booking.swishUUID}}  // Swish payment reference

// Teacher variables
{{teacher.firstName}}  // Teacher's first name
{{teacher.lastName}}   // Teacher's last name
{{teacher.fullName}}   // Teacher's full name

// System variables
{{schoolName}}         // School name from database
{{appUrl}}            // Application URL
{{currentYear}}       // Current year
{{currentDate}}       // Current date
```

### Template Processing
```typescript
// Fetch schoolname from database
const schoolnameSetting = await db
  .select()
  .from(siteSettings)
  .where(eq(siteSettings.key, 'schoolname'))
  .limit(1);

const schoolname = schoolnameSetting.length > 0 
  ? schoolnameSetting[0].value 
  : 'Din Trafikskola Hässleholm';

// Replace variables in template
processed = processed.replace(/\{\{schoolName\}\}/g, schoolname);
```

## Email Triggers

### Available Triggers
```typescript
type EmailTriggerType = 
  | 'user_login'           // User logs in
  | 'forgot_password'      // Password reset requested
  | 'new_user'            // New user registration
  | 'new_booking'         // New booking created
  | 'moved_booking'       // Booking rescheduled
  | 'cancelled_booking'   // Booking cancelled
  | 'booking_reminder'    // 24h before lesson
  | 'credits_reminder'    // Credits running low
  | 'payment_reminder'    // Payment overdue
  | 'payment_confirmation_request' // Payment confirmation needed
  | 'payment_confirmed'   // Payment successful
  | 'payment_declined'    // Payment failed
  | 'feedback_received'   // Student feedback submitted
  | 'teacher_daily_bookings' // Daily booking summary
  | 'teacher_feedback_reminder' // Remind teacher for feedback
  | 'new_password';       // New password generated
```

### Trigger Usage
```typescript
// Send triggered email
await EnhancedEmailService.sendTriggeredEmail('new_booking', {
  user: { id: '123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  booking: { 
    id: '456', 
    scheduledDate: '2024-01-15', 
    startTime: '10:00', 
    endTime: '11:00',
    lessonTypeName: 'Körlektion',
    totalPrice: '800'
  }
});
```

## Email Configuration

### Site Settings for Email
```typescript
// Key email settings in site_settings table
{
  schoolname: 'Din Trafikskola Hässleholm',     // School name for templates
  from_name: 'Din Trafikskola HLM',            // Email sender name
  from_email: 'noreply@dintrafikskolahlm.se', // Email sender address
  reply_to: 'info@dintrafikskolahlm.se',       // Reply-to address
  use_sendgrid: false,                         // Use SendGrid service
  sendgrid_api_key: '',                        // SendGrid API key
  use_smtp: true,                             // Use SMTP service
  smtp_host: 'mailcluster.loopia.se',         // SMTP server
  smtp_port: 587,                             // SMTP port
  smtp_username: 'admin@dintrafikskolahlm.se', // SMTP username
  smtp_password: '',                          // SMTP password (env variable)
}
```

### Configuration Retrieval
```typescript
// Get email configuration
const config = await EnhancedEmailService.getEmailConfig();

// Access configuration
const fromName = config.fromName;
const fromEmail = config.fromEmail;
const useSendgrid = config.useSendgrid;
```

## Email Delivery Methods

### 1. SendGrid (Primary)
```typescript
// SendGrid configuration
if (config.useSendgrid && config.sendgridApiKey) {
  sgMail.setApiKey(config.sendgridApiKey);
  
  const msg = {
    to: recipientEmail,
    from: config.fromEmail,
    subject: subject,
    html: htmlContent,
  };
  
  await sgMail.send(msg);
}
```

### 2. SMTP (Fallback)
```typescript
// SMTP configuration
const transporter = nodemailer.createTransporter({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpSecure,
  auth: {
    user: config.smtpUsername,
    pass: config.smtpPassword,
  },
});

await transporter.sendMail({
  from: config.fromEmail,
  to: recipientEmail,
  subject: subject,
  html: htmlContent,
});
```

### 3. Internal Messages (Last Resort)
```typescript
// Save as internal message if email fails
await db.insert(internalMessages).values({
  userId: context.user?.id,
  subject: subject,
  content: htmlContent,
  messageType: 'email_fallback',
  isRead: false,
});
```

## Email Template Management

### Database Schema
```typescript
// email_templates table
{
  id: string;                    // Template ID
  triggerType: EmailTriggerType; // Trigger type
  subject: string;               // Email subject
  htmlContent: string;           // HTML content
  isActive: boolean;             // Template active status
  createdAt: string;             // Creation timestamp
  updatedAt: string;             // Update timestamp
}

// email_receivers table
{
  id: string;                    // Receiver ID
  templateId: string;            // Template reference
  receiverType: EmailReceiverType; // Receiver type
  specificUserId?: string;       // Specific user ID
}
```

### Template Operations
```typescript
// Get all templates
const templates = await db
  .select()
  .from(emailTemplates)
  .orderBy(emailTemplates.triggerType);

// Get template with receivers
const templateWithReceivers = await Promise.all(
  templates.map(async (template) => {
    const receivers = await db
      .select()
      .from(emailReceivers)
      .where(eq(emailReceivers.templateId, template.id));
    
    return {
      ...template,
      receivers: receivers.map(r => r.receiverType)
    };
  })
);
```

## Email Testing

### Test Email Endpoint
```typescript
// POST /api/admin/email-test
{
  templateId: string;
  testEmail: string;
}

// Response
{
  message: string;
  success: boolean;
}
```

### Test Data Generation
```typescript
// Mock data for testing
const testData = {
  user: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    customerNumber: 'CUST123'
  },
  booking: {
    id: 'TEST123',
    scheduledDate: '2024-01-15',
    startTime: '10:00',
    endTime: '11:00',
    lessonTypeName: 'Körlektion',
    totalPrice: '800',
    swishUUID: 'SWISH123'
  },
  schoolName: 'Din Trafikskola Hässleholm',
  appUrl: 'https://dintrafikskolahlm.se'
};
```

## Error Handling

### Email Service Errors
```typescript
try {
  await EnhancedEmailService.sendTriggeredEmail(triggerType, context);
} catch (error) {
  logger.error('email', 'Failed to send email', { 
    triggerType, 
    error: error.message 
  });
  
  // Fallback to internal message
  await saveAsInternalMessage(options);
}
```

### Logging
```typescript
// Email logging
logger.info('email', 'Email sent successfully', {
  triggerType,
  recipient: recipientEmail,
  templateId: template.id
});

logger.warn('email', 'Email delivery failed, using fallback', {
  triggerType,
  error: error.message
});
```

## Best Practices

### 1. Always Use Database Schoolname
```typescript
// ✅ Correct - Fetch from database
const schoolname = await getSchoolnameFromDatabase();

// ❌ Incorrect - Hardcoded value
const schoolname = 'Din Trafikskola HLM';
```

### 2. Handle Email Failures Gracefully
```typescript
// ✅ Correct - Multiple fallback methods
try {
  await sendViaSendGrid(options);
} catch (error) {
  try {
    await sendViaSmtp(options);
  } catch (error) {
    await saveAsInternalMessage(options);
  }
}
```

### 3. Use Template Variables Consistently
```typescript
// ✅ Correct - Use standard variables
const template = `
  Hej {{user.firstName}},
  Din bokning för {{booking.lessonTypeName}} är bekräftad.
  Med vänliga hälsningar, {{schoolName}}
`;

// ❌ Incorrect - Hardcoded values
const template = `
  Hej John,
  Din bokning för Körlektion är bekräftad.
  Med vänliga hälsningar, Din Trafikskola HLM
`;
```

### 4. Test Email Templates
```typescript
// Always test new templates
await EnhancedEmailService.testEmailTemplate(
  templateId,
  'test@example.com'
);
```

## Common Patterns

### 1. Booking Confirmation Email
```typescript
// Trigger: new_booking
// Recipients: student, admin
// Variables: user, booking, schoolName
```

### 2. Payment Reminder Email
```typescript
// Trigger: payment_reminder
// Recipients: student
// Variables: user, booking, payment details
```

### 3. Teacher Daily Summary
```typescript
// Trigger: teacher_daily_bookings
// Recipients: teacher
// Variables: teacher, bookings array
```

This email system provides a robust, scalable solution for all email communications in the driving school application. 