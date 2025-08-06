# Developer Guide: Email Notifications

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Adding a New Email Trigger](#adding-a-new-email-trigger)
4. [Creating and Managing Templates](#creating-and-managing-templates)
5. [Testing and Debugging](#testing-and-debugging)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Introduction
This guide provides detailed instructions for developers working with the TrafikskolaX email notification system. It covers how to add new triggers, create templates, and handle common scenarios.

## System Architecture

The email notification system consists of several key components:

### 1. Database Schema
- `email_templates`: Stores template content and metadata
- `email_triggers`: Defines available triggers
- `email_receivers`: Maps templates to receiver types
- `email_logs`: Tracks sent emails

### 2. Core Services
- `NotificationService`: Main service for sending emails
- `EmailService`: Handles email delivery
- `TemplateService`: Manages template rendering

### 3. API Endpoints
- `POST /api/email/notify`: Main endpoint for triggering emails
- `GET/POST /api/admin/email-templates`: Manage templates
- `POST /api/admin/email-templates/preview`: Preview templates

## Adding a New Email Trigger

### Step 1: Define the Trigger Type
1. Add the trigger to the `EmailTriggerType` enum in `schema.ts`:
   ```typescript
   export enum EmailTriggerType {
     // ... existing triggers
     NEW_FEATURE_ANNOUNCEMENT = 'new_feature_announcement',
   }
   ```

### Step 2: Create a Service Method
Add a method to `NotificationService`:

```typescript
async onNewFeatureAnnouncement(userId: string, featureDetails: any) {
  return this.sendEmail({
    triggerType: 'new_feature_announcement',
    userId,
    customData: {
      featureName: featureDetails.name,
      featureDescription: featureDetails.description,
      releaseDate: featureDetails.releaseDate,
    }
  });
}
```

### Step 3: Create a Template
Use the admin interface to create a template with these variables:
- `{{featureName}}`
- `{{featureDescription}}`
- `{{releaseDate}}`

### Step 4: Trigger the Email
```typescript
// In your feature code
await notificationService.onNewFeatureAnnouncement(userId, {
  name: 'New Booking System',
  description: 'Check out our new and improved booking interface!',
  releaseDate: '2023-11-01'
});
```

## Creating and Managing Templates

### Template Structure
Each template includes:
- **Subject**: Email subject line (supports variables)
- **HTML Content**: The email body in HTML format
- **Trigger Type**: When this template should be used
- **Receivers**: Who should receive this email

### Available Template Helpers

#### Date Formatting
```html
{{formatDate someDate 'yyyy-MM-dd'}}
```

#### Conditional Content
```html
{{#if user.isPremium}}
  <p>Thank you for being a premium member!</p>
{{else}}
  <p>Upgrade to premium for exclusive benefits!</p>
{{/if}}
```

#### Loops
```html
<ul>
{{#each features as |feature|}}
  <li>{{feature.name}}: {{feature.description}}</li>
{{/each}}
</ul>
```

## Testing and Debugging

### Previewing Emails
1. Go to the template in the admin interface
2. Click the "Preview" tab
3. The system will show a preview with test data

### Sending Test Emails
1. In the admin interface, find your template
2. Click "Send Test"
3. Enter a test email address
4. The email will be sent immediately

### Logging
All email sends are logged to the database. Check the `email_logs` table for:
- Timestamp
- Recipient
- Template used
- Status (sent/failed)
- Error message (if any)

## Best Practices

### Template Design
1. **Mobile-First**
   - Use responsive design
   - Keep width under 600px
   - Use large, touch-friendly buttons

2. **Accessibility**
   - Use semantic HTML
   - Include alt text for images
   - Ensure good color contrast

3. **Performance**
   - Optimize images
   - Keep CSS inlined
   - Minimize HTML size

### Code Organization
1. **Service Methods**
   - Keep business logic in the service layer
   - Use TypeScript interfaces for type safety
   - Document expected parameters and return values

2. **Error Handling**
   - Catch and log all errors
   - Provide meaningful error messages
   - Implement retry logic for transient failures

## Troubleshooting

### Common Issues

#### Emails Not Sending
1. Check server logs for errors
2. Verify SMTP configuration
3. Check spam folder
4. Verify the template is active

#### Variables Not Rendering
1. Check variable names match exactly
2. Verify data is being passed correctly
3. Check for typos in template

#### Poor Deliverability
1. Check email authentication (SPF, DKIM, DMARC)
2. Monitor bounce rates
3. Warm up new IP addresses gradually

### Debugging Tips
1. **Local Testing**
   ```bash
   # Enable debug logging
   DEBUG=email* npm run dev
   ```

2. **Inspect Generated HTML**
   ```typescript
   const { html } = await templateService.renderTemplate(templateId, variables);
   console.log(html);
   ```

3. **Check Database**
   ```sql
   -- View recent email logs
   SELECT * FROM email_logs 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

## Advanced Topics

### Dynamic Templates
Create templates that change based on user data:

```typescript
async sendPersonalizedEmail(userId: string) {
  const user = await getUser(userId);
  const templateId = user.isPremium ? 'premium-welcome' : 'standard-welcome';
  
  return this.sendEmail({
    templateId,
    userId,
    customData: {
      // ...
    }
  });
}
```

### Rate Limiting
Prevent email abuse with rate limiting:

```typescript
// In your API route
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to email endpoints
app.use('/api/email', emailLimiter);
```

### A/B Testing
Test different email variations:

```typescript
async sendCampaignEmail(userId: string) {
  // Randomly assign variant
  const variant = Math.random() > 0.5 ? 'A' : 'B';
  const templateId = `campaign-${variant}`;
  
  return this.sendEmail({
    templateId,
    userId,
    // Track which variant was sent
    metadata: { variant }
  });
}
```

## Conclusion
This guide covers the essential aspects of working with the TrafikskolaX email notification system. By following these patterns and best practices, you can extend and maintain the system effectively.
