import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific setting
      const setting = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, key))
        .limit(1);

      if (setting.length === 0) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }

      return NextResponse.json(setting[0]);
    } else {
      // Get all settings
      const settings = await db
        .select()
        .from(siteSettings)
        .orderBy(siteSettings.key);

      return NextResponse.json(settings);
    }
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch site settings' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, description, category } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Insert or update setting
    const result = await db
      .insert(siteSettings)
      .values({
        key,
        value: String(value),
        description: description || null,
        category: category || 'general',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: String(value),
          description: description || null,
          category: category || 'general',
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update site settings' 
    }, { status: 500 });
  }
}
