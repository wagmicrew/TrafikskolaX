import { db } from '../lib/db';
import { siteSettings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function addSchoolEmailSetting() {
  try {
    // Check if school_email setting already exists
    const existingSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'school_email'))
      .limit(1);

    if (existingSetting.length === 0) {
      // Add school_email setting
      await db.insert(siteSettings).values({
        key: 'school_email',
        value: 'info@dintrafikskolahlm.se',
        description: 'School email address used for contact forms and system emails',
        category: 'email',
        isEnv: false,
      });

      console.log('✅ School email setting added successfully');
    } else {
      console.log('ℹ️ School email setting already exists');
    }
  } catch (error) {
    console.error('❌ Error adding school email setting:', error);
  } finally {
    process.exit(0);
  }
}

addSchoolEmailSetting(); 