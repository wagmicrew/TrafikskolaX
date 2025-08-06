import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI('admin');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

      return NextResponse.json({ 
        success: true, 
        message: 'School email setting added successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'School email setting already exists' 
      });
    }
  } catch (error) {
    console.error('Error adding school email setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 