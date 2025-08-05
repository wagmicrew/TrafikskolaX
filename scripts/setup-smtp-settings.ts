import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { siteSettings } from '../lib/db/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const SMTP_SETTINGS = [
  {
    key: 'use_smtp',
    value: 'true',
    category: 'email',
    description: 'Enable SMTP email sending'
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
    value: 'Tropictiger2025!',
    category: 'email',
    description: 'SMTP password'
  },
  {
    key: 'smtp_secure',
    value: 'false',
    category: 'email',
    description: 'Use SSL/TLS for SMTP'
  },
  {
    key: 'admin_email',
    value: 'admin@dintrafikskolahlm.se',
    category: 'email',
    description: 'Admin email address'
  },
  {
    key: 'school_email',
    value: 'school@dintrafikskolahlm.se',
    category: 'email',
    description: 'School email address'
  },
  {
    key: 'fallback_to_internal',
    value: 'true',
    category: 'email',
    description: 'Fallback to internal messages if email fails'
  },
  {
    key: 'force_internal_only',
    value: 'false',
    category: 'email',
    description: 'Force all emails to be internal messages only'
  }
];

async function setupSmtpSettings() {
  console.log('Setting up SMTP email settings...');
  
  try {
    for (const setting of SMTP_SETTINGS) {
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
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✓ Added setting: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`⚠ Setting already exists: ${setting.key} = ${existing[0].value}`);
      }
    }

    console.log('\n✅ SMTP settings setup completed!');
    console.log('\nYour email configuration should now be:');
    console.log('- SMTP Host: mailcluster.loopia.se');
    console.log('- SMTP Port: 587');
    console.log('- SMTP Username: admin@dintrafikskolahlm.se');
    console.log('- SMTP Password: Tropictiger2025!');
    console.log('- SMTP Secure: false (uses STARTTLS)');
    
  } catch (error) {
    console.error('❌ Error setting up SMTP settings:', error);
  }
}

// Run the setup
setupSmtpSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
