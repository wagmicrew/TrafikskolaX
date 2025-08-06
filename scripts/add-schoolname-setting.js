import { db } from '../lib/db';
import { siteSettings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function addSchoolnameSetting() {
  try {
    // Check if schoolname setting already exists
    const existingSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'schoolname'))
      .limit(1);

    if (existingSetting.length === 0) {
      // Add schoolname setting
      await db.insert(siteSettings).values({
        key: 'schoolname',
        value: 'Din Trafikskola Hässleholm',
        description: 'School name used in email templates and throughout the application',
        category: 'general',
        isEnv: false,
      });

      console.log('✅ Schoolname setting added successfully');
    } else {
      console.log('ℹ️ Schoolname setting already exists');
    }
  } catch (error) {
    console.error('❌ Error adding schoolname setting:', error);
  } finally {
    process.exit(0);
  }
}

addSchoolnameSetting(); 