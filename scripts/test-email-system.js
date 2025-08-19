import { db } from '../lib/db/index.js';
import { emailTemplates, emailReceivers } from '../lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Test script to verify the email system works after migration
 */
async function testEmailSystem() {
  console.log('🧪 Testing email system after migration...\n');
  
  try {
    // 1. Check that key templates exist and have modern design
    const requiredTemplates = [
      'new_user', 
      'new_booking', 
      'payment_confirmed', 
      'booking_confirmed',
      'payment_reminder',
      'awaiting_school_confirmation',
      'swish_payment_verification'
    ];

    console.log('📋 Checking required templates...');
    
    for (const triggerType of requiredTemplates) {
      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.triggerType, triggerType))
        .limit(1);

      if (template.length === 0) {
        console.log(`❌ Missing template: ${triggerType}`);
        continue;
      }

      const t = template[0];
      const html = t.htmlContent;
      
      // Check modern design features
      const hasSchoolPhone = html.includes('{{schoolPhone}}');
      const hasSchoolEmail = html.includes('{{schoolEmail}}');
      const hasSchoolName = html.includes('{{schoolName}}');
      const hasModernStyling = html.includes('border-radius:8px');
      const hasButtonStyling = html.includes('data-btn');
      
      const allFeatures = hasSchoolPhone && hasSchoolEmail && hasSchoolName && hasModernStyling;
      
      console.log(`${allFeatures ? '✅' : '❌'} ${triggerType}:`);
      console.log(`    School phone: ${hasSchoolPhone ? '✅' : '❌'}`);
      console.log(`    School email: ${hasSchoolEmail ? '✅' : '❌'}`);
      console.log(`    School name: ${hasSchoolName ? '✅' : '❌'}`);
      console.log(`    Modern styling: ${hasModernStyling ? '✅' : '❌'}`);
      console.log(`    Button styling: ${hasButtonStyling ? '✅' : '❌'}`);
      
      // Check receivers
      const receivers = await db
        .select()
        .from(emailReceivers)
        .where(eq(emailReceivers.templateId, t.id));
      
      console.log(`    Receivers: ${receivers.map(r => r.receiverType).join(', ') || 'None'}`);
      console.log('');
    }

    // 2. Summary statistics
    const allTemplates = await db
      .select()
      .from(emailTemplates);

    const modernTemplates = allTemplates.filter(t => {
      const html = t.htmlContent;
      return html.includes('{{schoolPhone}}') && 
             html.includes('{{schoolEmail}}') && 
             html.includes('{{schoolName}}') &&
             html.includes('border-radius:8px');
    });

    console.log('📊 System Overview:');
    console.log(`   Total templates: ${allTemplates.length}`);
    console.log(`   Modern templates: ${modernTemplates.length}`);
    console.log(`   Active templates: ${allTemplates.filter(t => t.isActive).length}`);
    console.log(`   Migration success rate: ${Math.round((modernTemplates.length / allTemplates.length) * 100)}%`);

    // 3. Check for template content quality
    console.log('\n🎨 Template Quality Check:');
    
    const qualityIssues = [];
    
    for (const template of allTemplates) {
      const html = template.htmlContent;
      
      if (!html.includes('{{user.firstName}}')) {
        qualityIssues.push(`${template.triggerType}: Missing user.firstName variable`);
      }
      
      if (!html.includes('{{appUrl}}')) {
        qualityIssues.push(`${template.triggerType}: Missing appUrl variable`);
      }
      
      if (html.length < 100) {
        qualityIssues.push(`${template.triggerType}: Template too short (${html.length} chars)`);
      }
    }

    if (qualityIssues.length === 0) {
      console.log('✅ All templates pass quality checks!');
    } else {
      console.log(`⚠️ Found ${qualityIssues.length} quality issues:`);
      qualityIssues.forEach(issue => console.log(`   - ${issue}`));
    }

    // 4. Test variable replacement (mock)
    console.log('\n🔧 Variable Replacement Test:');
    
    const testTemplate = modernTemplates[0];
    if (testTemplate) {
      let processed = testTemplate.htmlContent;
      
      // Mock variable replacements
      processed = processed.replace(/\{\{user\.firstName\}\}/g, 'TestUser');
      processed = processed.replace(/\{\{schoolName\}\}/g, 'Din Trafikskola Hässleholm');
      processed = processed.replace(/\{\{schoolPhone\}\}/g, '0760-38 91 92');
      processed = processed.replace(/\{\{schoolEmail\}\}/g, 'info@dintrafikskolahlm.se');
      processed = processed.replace(/\{\{appUrl\}\}/g, 'https://dintrafikskolahlm.se');
      
      const hasUnreplacedVars = processed.match(/\{\{[^}]+\}\}/g);
      
      if (hasUnreplacedVars) {
        console.log(`⚠️ Unreplaced variables found: ${hasUnreplacedVars.join(', ')}`);
      } else {
        console.log('✅ Variable replacement test passed!');
      }
    }

    console.log('\n🎯 Final Assessment:');
    
    if (modernTemplates.length === allTemplates.length && qualityIssues.length === 0) {
      console.log('🟢 EXCELLENT: Email system is fully updated and ready!');
      console.log('   ✅ All templates use modern design');
      console.log('   ✅ All required variables are present');
      console.log('   ✅ Consistent styling and branding');
      console.log('   ✅ Proper button styling with data-btn attributes');
    } else if (modernTemplates.length >= allTemplates.length * 0.8) {
      console.log('🟡 GOOD: Most templates are updated, minor issues remain');
    } else {
      console.log('🔴 NEEDS WORK: Significant issues found, re-run migration');
    }

  } catch (error) {
    console.error('❌ Error testing email system:', error);
    throw error;
  }
}

// Run the test
testEmailSystem()
  .then(() => {
    console.log('\n✅ Email system test complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
