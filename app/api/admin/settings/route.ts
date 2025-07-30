import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq, or, inArray } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const user = await requireAuth(cookieStore);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all settings
    const settings = await db.select().from(siteSettings);
    
    // Convert to key-value map
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value === 'true' ? true : 
                         setting.value === 'false' ? false : 
                         setting.value || '';
      return acc;
    }, {} as Record<string, any>);

    // Ensure all expected keys exist with defaults
    const defaultSettings = {
      use_sendgrid: false,
      sendgrid_api_key: '',
      from_name: 'Din Trafikskola Hässleholm',
      from_email: 'noreply@dintrafikskolahlm.se',
      reply_to: 'info@dintrafikskolahlm.se',
      site_domain: '',
      site_name: 'Din Trafikskola Hässleholm',
      swish_number: '',
      swish_enabled: false,
      qliro_api_key: '',
      qliro_enabled: false,
    };

    const mergedSettings = { ...defaultSettings, ...settingsMap };

    return NextResponse.json({ settings: mergedSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const user = await requireAuth(cookieStore);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Define which keys belong to which category
    const categoryMapping: Record<string, string> = {
      use_sendgrid: 'email',
      sendgrid_api_key: 'email',
      from_name: 'email',
      from_email: 'email',
      reply_to: 'email',
      site_domain: 'general',
      site_name: 'general',
      swish_number: 'payment',
      swish_enabled: 'payment',
      qliro_api_key: 'payment',
      qliro_enabled: 'payment',
    };

    // Update or insert each setting
    for (const [key, value] of Object.entries(updates)) {
      const stringValue = typeof value === 'boolean' ? value.toString() : String(value);
      const category = categoryMapping[key] || 'general';

      // Check if setting exists
      const existing = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, key))
        .limit(1);

      if (existing.length > 0) {
        // Update existing setting
        await db
          .update(siteSettings)
          .set({ 
            value: stringValue,
            category,
            updatedAt: new Date()
          })
          .where(eq(siteSettings.key, key));
      } else {
        // Insert new setting
        await db
          .insert(siteSettings)
          .values({
            key,
            value: stringValue,
            category,
            description: `${key} setting`
          });
      }
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
