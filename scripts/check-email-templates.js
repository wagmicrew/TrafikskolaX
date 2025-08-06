import { db } from '../lib/db/index.js';
import { emailTemplates, emailReceivers } from '../lib/db/schema/email-templates.js';
import { eq } from 'drizzle-orm';

async function checkEmailTemplates() {
  try {
    console.log('Checking email templates...');
    
    // Get all templates
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.triggerType);

    console.log(`Found ${templates.length} email templates:`);
    
    for (const template of templates) {
      console.log(`- ${template.triggerType} (ID: ${template.id})`);
      
      // Get receivers for this template
      const receivers = await db
        .select()
        .from(emailReceivers)
        .where(eq(emailReceivers.templateId, template.id));
      
      console.log(`  Receivers: ${receivers.map(r => r.receiverType).join(', ')}`);
    }

    // Check specifically for swish_payment_verification
    const swishTemplate = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.triggerType, 'swish_payment_verification'))
      .limit(1);

    if (swishTemplate.length > 0) {
      console.log('\nSwish payment verification template found:');
      console.log(`- ID: ${swishTemplate[0].id}`);
      console.log(`- Subject: ${swishTemplate[0].subject}`);
      console.log(`- Active: ${swishTemplate[0].isActive}`);
      
      const swishReceivers = await db
        .select()
        .from(emailReceivers)
        .where(eq(emailReceivers.templateId, swishTemplate[0].id));
      
      console.log(`- Receivers: ${swishReceivers.map(r => r.receiverType).join(', ')}`);
    } else {
      console.log('\nNo swish_payment_verification template found');
    }

  } catch (error) {
    console.error('Error checking email templates:', error);
  }
}

checkEmailTemplates(); 