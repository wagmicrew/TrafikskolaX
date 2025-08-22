import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAuth('admin');

    const defaultApiKey = 'ctrftbh9mzgkawsuuql8861wbce1ubk5ptt4q775x8l4m4k6';

    // Check if TinyMCE API key setting already exists
    const existingSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'tinymce_api_key'))
      .limit(1);

    if (existingSetting.length > 0) {
      // Update existing setting
      await db
        .update(siteSettings)
        .set({
          value: defaultApiKey,
          description: 'API-nyckel för TinyMCE WYSIWYG-editorer',
          category: 'editor',
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.key, 'tinymce_api_key'));

      return NextResponse.json({
        success: true,
        message: 'TinyMCE API-nyckel uppdaterad!',
        action: 'updated'
      });
    } else {
      // Create new setting
      await db.insert(siteSettings).values({
        key: 'tinymce_api_key',
        value: defaultApiKey,
        description: 'API-nyckel för TinyMCE WYSIWYG-editorer',
        category: 'editor',
        isEnv: false,
      });

      return NextResponse.json({
        success: true,
        message: 'TinyMCE API-nyckel tillagd!',
        action: 'created'
      });
    }

  } catch (error) {
    console.error('Error adding TinyMCE API key:', error);
    return NextResponse.json(
      { error: 'Kunde inte lägga till TinyMCE API-nyckel' },
      { status: 500 }
    );
  }
}
