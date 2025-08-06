import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getDefaultTemplate } from '@/lib/email/email-template-utils';
import { EmailTriggerType } from '@/lib/email/enhanced-email-service';

/**
 * Script to migrate existing email templates to use the new improved format
 * and ensure they include proper school data and HTML structure.
 */
async function migrateTemplates() {
  console.log('Starting email template migration...');
  
  // Get all existing templates
  const existingTemplates = await db
    .select()
    .from(emailTemplates);
  
  console.log(`Found ${existingTemplates.length} existing templates to process`);
  
  let updatedCount = 0;
  let createdCount = 0;
  
  // Process each trigger type to ensure we have all required templates
  const triggerTypes: EmailTriggerType[] = [
    'user_login',
    'forgot_password',
    'new_user',
    'new_booking',
    'moved_booking',
    'cancelled_booking',
    'booking_reminder',
    'booking_confirmed',
    'credits_reminder',
    'payment_reminder',
    'payment_confirmation_request',
    'payment_confirmed',
    'payment_declined',
    'feedback_received',
    'teacher_daily_bookings',
    'teacher_feedback_reminder',
    'awaiting_school_confirmation',
    'pending_school_confirmation',
    'new_password'
  ];
  
  for (const triggerType of triggerTypes) {
    const existing = existingTemplates.find(t => t.triggerType === triggerType);
    const defaultTemplate = await getDefaultTemplate(triggerType);
    
    if (existing) {
      // Update existing template with improved HTML if needed
      const needsUpdate = 
        existing.htmlContent !== defaultTemplate.htmlContent.trim() ||
        existing.subject !== defaultTemplate.subject;
      
      if (needsUpdate) {
        console.log(`Updating template for ${triggerType}...`);
        
        await db
          .update(emailTemplates)
          .set({
            subject: defaultTemplate.subject,
            htmlContent: defaultTemplate.htmlContent.trim(),
            updatedAt: new Date()
          })
          .where(eq(emailTemplates.id, existing.id));
        
        updatedCount++;
      } else {
        console.log(`Template for ${triggerType} is up to date`);
      }
    } else {
      // Create new template with default content
      console.log(`Creating new template for ${triggerType}...`);
      
      await db.insert(emailTemplates).values({
        triggerType,
        subject: defaultTemplate.subject,
        htmlContent: defaultTemplate.htmlContent.trim(),
        isActive: true
      });
      
      createdCount++;
    }
  }
  
  console.log('\nMigration complete!');
  console.log(`- Updated: ${updatedCount} templates`);
  console.log(`- Created: ${createdCount} new templates`);
  console.log(`- Total templates: ${existingTemplates.length + createdCount - updatedCount}`);
  
  process.exit(0);
}

// Run the migration
migrateTemplates().catch(error => {
  console.error('Error during migration:', error);
  process.exit(1);
});
