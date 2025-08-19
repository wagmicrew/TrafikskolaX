import { db } from '../lib/db/index.js';
import { emailTemplates, emailReceivers } from '../lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Script to analyze current email templates in the database
 * This will help us understand what templates exist and their current state
 */
async function analyzeEmailTemplates() {
  console.log('🔍 Analyzing email templates in database...\n');
  
  try {
    // Get all templates with their receivers
    const templates = await db
      .select({
        id: emailTemplates.id,
        triggerType: emailTemplates.triggerType,
        subject: emailTemplates.subject,
        htmlContent: emailTemplates.htmlContent,
        isActive: emailTemplates.isActive,
        createdAt: emailTemplates.createdAt,
        updatedAt: emailTemplates.updatedAt
      })
      .from(emailTemplates)
      .orderBy(emailTemplates.triggerType);

    console.log(`📊 Found ${templates.length} email templates in database\n`);

    if (templates.length === 0) {
      console.log('❌ No email templates found in database');
      return;
    }

    // Analyze each template
    for (const template of templates) {
      console.log(`📧 Template: ${template.triggerType}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Subject: ${template.subject}`);
      console.log(`   Active: ${template.isActive}`);
      console.log(`   Created: ${template.createdAt}`);
      console.log(`   Updated: ${template.updatedAt}`);
      
      // Get receivers for this template
      const receivers = await db
        .select()
        .from(emailReceivers)
        .where(eq(emailReceivers.templateId, template.id));
      
      console.log(`   Receivers: ${receivers.map(r => r.receiverType).join(', ') || 'None'}`);
      
      // Analyze HTML content
      const htmlContent = template.htmlContent;
      const hasModernStructure = htmlContent.includes('data-standard-email="1"');
      const hasGradientHeader = htmlContent.includes('linear-gradient(135deg, #dc2626');
      const hasSchoolPhone = htmlContent.includes('{{schoolPhone}}');
      const hasSchoolEmail = htmlContent.includes('{{schoolEmail}}');
      const hasButtonStyles = htmlContent.includes('data-btn');
      
      console.log(`   Analysis:`);
      console.log(`     Modern structure: ${hasModernStructure ? '✅' : '❌'}`);
      console.log(`     Gradient header: ${hasGradientHeader ? '✅' : '❌'}`);
      console.log(`     School phone variable: ${hasSchoolPhone ? '✅' : '❌'}`);
      console.log(`     School email variable: ${hasSchoolEmail ? '✅' : '❌'}`);
      console.log(`     Button styling: ${hasButtonStyles ? '✅' : '❌'}`);
      console.log(`     Content length: ${htmlContent.length} chars`);
      
      // Check if needs update
      const needsUpdate = !hasModernStructure || !hasGradientHeader || !hasSchoolPhone || !hasSchoolEmail;
      console.log(`   Needs update: ${needsUpdate ? '🔄 YES' : '✅ NO'}`);
      console.log('');
    }

    // Summary
    const needsUpdateCount = templates.filter(t => {
      const html = t.htmlContent;
      return !html.includes('data-standard-email="1"') || 
             !html.includes('linear-gradient(135deg, #dc2626') ||
             !html.includes('{{schoolPhone}}') ||
             !html.includes('{{schoolEmail}}');
    }).length;

    console.log('📈 Summary:');
    console.log(`   Total templates: ${templates.length}`);
    console.log(`   Active templates: ${templates.filter(t => t.isActive).length}`);
    console.log(`   Templates needing update: ${needsUpdateCount}`);
    console.log(`   Templates up to date: ${templates.length - needsUpdateCount}`);

    if (needsUpdateCount > 0) {
      console.log('\n🚀 Run the migration script to update templates with modern design');
    } else {
      console.log('\n✨ All templates are up to date!');
    }

  } catch (error) {
    console.error('❌ Error analyzing email templates:', error);
    throw error;
  }
}

// Run the analysis
analyzeEmailTemplates()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Analysis failed:', error);
    process.exit(1);
  });
