const { db } = require('../lib/db');
const { siteSettings } = require('../lib/db/schema');

async function initializeEmailSettings() {
  try {
    console.log('🚀 Initializing email settings...');

    const emailSettings = [
      {
        key: 'use_sendgrid',
        value: 'false',
        category: 'email',
        description: 'Enable SendGrid for email delivery'
      },
      {
        key: 'sendgrid_api_key',
        value: '',
        category: 'email',
        description: 'SendGrid API key'
      },
      {
        key: 'use_smtp',
        value: 'false',
        category: 'email',
        description: 'Enable SMTP for email delivery'
      },
      {
        key: 'smtp_host',
        value: 'mailcluster.loopia.se',
        category: 'email',
        description: 'SMTP server hostname'
      },
      {
        key: 'smtp_port',
        value: '587',
        category: 'email',
        description: 'SMTP server port'
      },
      {
        key: 'smtp_username',
        value: 'admin@dintrafikskolahlm.se',
        category: 'email',
        description: 'SMTP username'
      },
      {
        key: 'smtp_password',
        value: '',
        category: 'email',
        description: 'SMTP password'
      },
      {
        key: 'smtp_secure',
        value: 'false',
        category: 'email',
        description: 'Use secure connection for SMTP'
      },
      {
        key: 'from_name',
        value: 'Din Trafikskola Hässleholm',
        category: 'email',
        description: 'Email sender name'
      },
      {
        key: 'from_email',
        value: 'noreply@dintrafikskolahlm.se',
        category: 'email',
        description: 'Email sender address'
      },
      {
        key: 'reply_to',
        value: 'info@dintrafikskolahlm.se',
        category: 'email',
        description: 'Reply-to email address'
      },
      {
        key: 'school_email',
        value: 'info@dintrafikskolahlm.se',
        category: 'email',
        description: 'School email address for contact forms'
      },
      {
        key: 'force_internal_only',
        value: 'false',
        category: 'email',
        description: 'Force internal messaging only (for testing)'
      },
      {
        key: 'fallback_to_internal',
        value: 'true',
        category: 'email',
        description: 'Fallback to internal messaging if email fails'
      }
    ];

    for (const setting of emailSettings) {
      // Check if setting already exists
      const existing = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, setting.key))
        .limit(1);

      if (existing.length === 0) {
        // Insert new setting
        await db.insert(siteSettings).values({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          description: setting.description,
          isEnv: false,
        });
        console.log(`✅ Added: ${setting.key}`);
      } else {
        console.log(`ℹ️ Already exists: ${setting.key}`);
      }
    }

    console.log('🎉 Email settings initialization completed!');
    console.log('\n📧 Email Configuration Summary:');
    console.log('- SendGrid: Disabled by default');
    console.log('- SMTP: Disabled by default');
    console.log('- Internal messaging: Enabled as fallback');
    console.log('- School email: info@dintrafikskolahlm.se');
    console.log('\n🔧 Next steps:');
    console.log('1. Go to Admin → Settings → Email Settings');
    console.log('2. Configure either SendGrid or SMTP');
    console.log('3. Test the contact form email functionality');

  } catch (error) {
    console.error('❌ Error initializing email settings:', error);
  } finally {
    process.exit(0);
  }
}

// Import required modules
const { eq } = require('drizzle-orm');

// Run the initialization
initializeEmailSettings(); 