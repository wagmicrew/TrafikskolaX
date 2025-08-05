// Load environment variables first
require('dotenv').config({ path: '.env.local' });

import { db } from '../lib/db';
import { siteSettings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkEmailSettings() {
  try {
    console.log('Checking email settings in database...\n');
    
    // Check all settings first
    const allSettings = await db
      .select()
      .from(siteSettings);
    
    console.log(`Found ${allSettings.length} total settings in database\n`);
    
    const settings = allSettings.filter(s => s.category === 'email');
    console.log(`Found ${settings.length} email category settings\n`);
    
    // Also check for smtp-related settings regardless of category
    const smtpSettings = allSettings.filter(s => s.key.includes('smtp') || s.key === 'use_smtp');
    if (smtpSettings.length > 0) {
      console.log('SMTP-related settings found (any category):');
      smtpSettings.forEach(s => {
        console.log(`  ${s.key}: ${s.value} (category: ${s.category})`);
      });
      console.log();
    }
    
    console.log('Current email settings:');
    console.log('=' .repeat(50));
    
    if (settings.length === 0) {
      console.log('No email settings found in database!');
      return;
    }
    
    settings.forEach(setting => {
      const displayValue = setting.key.includes('password') || setting.key.includes('api_key') 
        ? (setting.value ? '***HIDDEN***' : 'null') 
        : setting.value;
      console.log(`${setting.key.padEnd(25)}: ${displayValue} (type: ${typeof setting.value})`);
    });
    
    console.log('\n' + '=' .repeat(50));
    
    // Check critical SMTP settings
    const criticalSettings = ['use_smtp', 'smtp_host', 'smtp_username', 'smtp_password'];
    console.log('\nCritical SMTP settings check:');
    criticalSettings.forEach(key => {
      const setting = settings.find(s => s.key === key);
      const status = setting?.value ? '✅' : '❌';
      console.log(`${status} ${key}: ${setting?.value || 'MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error checking email settings:', error);
  } finally {
    process.exit(0);
  }
}

checkEmailSettings();
