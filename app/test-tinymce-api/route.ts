import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAuth('admin');

    // Fetch TinyMCE API key setting
    const apiKeySetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'tinymce_api_key'))
      .limit(1);

    const apiKey = apiKeySetting.length > 0 ? apiKeySetting[0].value : null;

    return NextResponse.json({
      success: true,
      apiKey: apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'No API key found',
      settingExists: apiKeySetting.length > 0
    });

  } catch (error) {
    console.error('Error checking TinyMCE API key:', error);
    return NextResponse.json(
      { error: 'Failed to check API key' },
      { status: 500 }
    );
  }
}
