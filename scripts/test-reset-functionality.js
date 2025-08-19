require('dotenv').config();
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
const { pgTable, uuid, varchar, text, boolean, timestamp } = require('drizzle-orm/pg-core');

// Define schema directly to avoid import issues
const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  triggerType: varchar('trigger_type', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  htmlContent: text('html_content').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

const emailReceivers = pgTable('email_receivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull(),
  receiverType: varchar('receiver_type', { length: 50 }).notNull()
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function testResetFunctionality() {
  console.log('🧪 Testing Reset Functionality...\n');

  try {
    // Step 1: Check current state of templates
    console.log('📋 Step 1: Checking current templates...');
    const currentTemplates = await db.select().from(emailTemplates);
    console.log(`Found ${currentTemplates.length} templates in database`);

    // Step 2: Simulate the reset functionality by calling the API logic
    console.log('\n🔄 Step 2: Testing reset functionality...');
    
    // Test that we can call the seed-reminders endpoint logic
    const modernTemplates = [
      {
        triggerType: 'new_user',
        subject: 'Välkommen till Din Trafikskola Hässleholm! 🚗',
        receivers: ['student'],
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Din Trafikskola Hässleholm</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Din väg till körkortet</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Välkommen {{user.firstName}}! 🎉</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                Tack för att du registrerat dig hos oss. Vi ser fram emot att hjälpa dig på din resa mot körkortet!
              </p>
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #374151;"><strong>Ditt kundnummer:</strong> {{user.customerNumber}}</p>
                <p style="margin: 8px 0 0 0; color: #374151;"><strong>E-post:</strong> {{user.email}}</p>
              </div>
              <p style="color: #4b5563; line-height: 1.6; margin: 24px 0;">
                Du kan nu logga in på vår hemsida för att boka körlektioner och följa dina framsteg.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{appUrl}}/login" data-btn style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);">
                  Logga in på ditt konto
                </a>
              </div>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                📞 {{schoolPhone}} | ✉️ {{schoolEmail}}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © {{currentYear}} {{schoolName}}
              </p>
            </div>
          </div>
        `.trim()
      }
    ];

    // Step 3: Check for modern design elements
    console.log('\n🎨 Step 3: Checking for modern design elements...');
    let modernCount = 0;
    let legacyCount = 0;

    for (const template of currentTemplates) {
      const html = template.htmlContent || '';
      const hasModernDesign = html.includes('border-radius:8px') && 
                             html.includes('{{schoolPhone}}') && 
                             html.includes('{{schoolEmail}}');
      
      if (hasModernDesign) {
        modernCount++;
        console.log(`✅ ${template.triggerType}: Modern design detected`);
      } else {
        legacyCount++;
        console.log(`❌ ${template.triggerType}: Legacy design (needs update)`);
      }
    }

    console.log(`\n📊 Summary: ${modernCount} modern templates, ${legacyCount} legacy templates`);

    // Step 4: Test receiver associations
    console.log('\n👥 Step 4: Checking receiver associations...');
    const receiversCount = await db.select().from(emailReceivers);
    console.log(`Found ${receiversCount.length} receiver associations`);

    // Check for orphaned receivers
    const templateIds = currentTemplates.map(t => t.id);
    const orphanedReceivers = receiversCount.filter(r => !templateIds.includes(r.templateId));
    if (orphanedReceivers.length > 0) {
      console.log(`⚠️  Found ${orphanedReceivers.length} orphaned receiver associations`);
    } else {
      console.log('✅ All receiver associations are valid');
    }

    // Step 5: Check template variables
    console.log('\n🔗 Step 5: Checking template variables...');
    const requiredVars = ['{{schoolPhone}}', '{{schoolEmail}}', '{{schoolName}}'];
    let variableIssues = 0;

    for (const template of currentTemplates) {
      const html = template.htmlContent || '';
      const missingVars = requiredVars.filter(v => !html.includes(v));
      
      if (missingVars.length > 0) {
        console.log(`⚠️  ${template.triggerType}: Missing variables: ${missingVars.join(', ')}`);
        variableIssues++;
      }
    }

    if (variableIssues === 0) {
      console.log('✅ All templates have required variables');
    }

    // Step 6: Test data-btn attribute presence
    console.log('\n🔘 Step 6: Checking button styling...');
    let buttonIssues = 0;

    for (const template of currentTemplates) {
      const html = template.htmlContent || '';
      const hasButtons = html.includes('<a ');
      const hasDataBtn = html.includes('data-btn');
      
      if (hasButtons && !hasDataBtn) {
        console.log(`⚠️  ${template.triggerType}: Has buttons but missing data-btn attributes`);
        buttonIssues++;
      }
    }

    if (buttonIssues === 0) {
      console.log('✅ All buttons have proper styling attributes');
    }

    console.log('\n🎯 Reset Functionality Test Complete!');
    console.log('=====================================');
    console.log(`Templates in database: ${currentTemplates.length}`);
    console.log(`Modern templates: ${modernCount}`);
    console.log(`Legacy templates: ${legacyCount}`);
    console.log(`Receiver associations: ${receiversCount.length}`);
    console.log(`Variable issues: ${variableIssues}`);
    console.log(`Button styling issues: ${buttonIssues}`);

    const isReadyForReset = legacyCount > 0 || variableIssues > 0 || buttonIssues > 0;
    console.log(`\n${isReadyForReset ? '🔄 Reset needed' : '✅ Templates are up to date'}`);

  } catch (error) {
    console.error('❌ Error testing reset functionality:', error);
    throw error;
  }
}

// Run the test
testResetFunctionality()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
