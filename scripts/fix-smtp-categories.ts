// Load environment variables first
require('dotenv').config({ path: '.env.local' });

import { db } from '../lib/db';
import { siteSettings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixSmtpCategories() {
  try {
    console.log('Fixing SMTP settings categories...\n');
    
    const keysToFix = ['use_smtp', 'smtp_password', 'smtp_secure'];
    
    for (const key of keysToFix) {
      const result = await db
        .update(siteSettings)
        .set({ 
          category: 'email',
          updatedAt: new Date()
        })
        .where(eq(siteSettings.key, key));
      
      console.log(`✓ Updated ${key} category to 'email'`);
    }
    
    console.log('\n✅ All SMTP settings now have correct email category!');
    
    // Verify the fix
    console.log('\nVerifying fix...');
    const emailSettings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.category, 'email'));
    
    const smtpKeys = emailSettings.filter(s => 
      s.key.includes('smtp') || s.key === 'use_smtp'
    );
    
    console.log('\nSMTP settings in email category:');
    smtpKeys.forEach(setting => {
      const displayValue = setting.key.includes('password') 
        ? '***HIDDEN***' 
        : setting.value;
      console.log(`  ${setting.key}: ${displayValue}`);
    });
    
  } catch (error) {
    console.error('Error fixing SMTP categories:', error);
  } finally {
    process.exit(0);
  }
}

fixSmtpCategories();
