// Load environment variables first
require('dotenv').config({ path: '.env.local' });

import { db } from '../lib/db';
import { siteSettings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixSmtpSecure() {
  try {
    console.log('Fixing SMTP secure setting for port 587...\n');
    
    // Port 587 should use smtp_secure: false with STARTTLS
    // Port 465 would use smtp_secure: true for direct SSL
    
    const result = await db
      .update(siteSettings)
      .set({ 
        value: 'false',
        updatedAt: new Date()
      })
      .where(eq(siteSettings.key, 'smtp_secure'));
    
    console.log('✓ Updated smtp_secure to "false" for STARTTLS on port 587');
    
    // Verify the fix
    console.log('\nVerifying SMTP configuration...');
    const smtpSettings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.category, 'email'));
    
    const smtpConfig = smtpSettings
      .filter((s: any) => s.key.includes('smtp') || s.key === 'use_smtp')
      .reduce((acc: Record<string, string>, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
    
    console.log('\nCurrent SMTP configuration:');
    console.log(`  Host: ${smtpConfig.smtp_host}`);
    console.log(`  Port: ${smtpConfig.smtp_port}`);
    console.log(`  Secure: ${smtpConfig.smtp_secure}`);
    console.log(`  Username: ${smtpConfig.smtp_username}`);
    console.log(`  Password: ${smtpConfig.smtp_password ? '***SET***' : 'NOT SET'}`);
    
    console.log('\n✅ SMTP configuration should now work correctly!');
    console.log('ℹ️  Port 587 with secure=false uses STARTTLS encryption');
    
  } catch (error) {
    console.error('Error fixing SMTP secure setting:', error);
  } finally {
    process.exit(0);
  }
}

fixSmtpSecure();
