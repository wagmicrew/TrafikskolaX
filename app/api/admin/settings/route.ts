import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq, or, inArray } from 'drizzle-orm';
import { withDefaults } from '@/lib/site-settings/opening-hours';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuthAPI('admin');

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    // Fetch all settings
    const settings = await db.select().from(siteSettings);
    
    // Convert to key-value map
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value === 'true' ? true : 
                         setting.value === 'false' ? false : 
                         setting.value || '';
      return acc;
    }, {} as Record<string, any>);

    // Parse opening_hours JSON safely and provide defaults
    const ohRow = settings.find((s) => s.key === 'opening_hours');
    if (ohRow && ohRow.value) {
      try {
        settingsMap['opening_hours'] = withDefaults(JSON.parse(ohRow.value));
      } catch {
        settingsMap['opening_hours'] = withDefaults(null);
      }
    } else {
      settingsMap['opening_hours'] = withDefaults(null);
    }

    // Ensure all expected keys exist with defaults
    const defaultSettings = {
      // Email settings
      use_sendgrid: false,
      sendgrid_api_key: '',
      use_smtp: false,
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_secure: false,
      from_name: 'Din Trafikskola Hässleholm',
      from_email: 'noreply@dintrafikskolahlm.se',
      reply_to: 'info@dintrafikskolahlm.se',
      school_email: 'info@dintrafikskolahlm.se',
      force_internal_only: false,
      fallback_to_internal: true,
      
      // Site settings
      site_domain: '',
      public_app_url: '',
      site_name: 'Din Trafikskola Hässleholm',
      schoolname: 'Din Trafikskola Hässleholm',
      school_phonenumber: '',
      internal_messages_enabled: true,
      
      // Payment settings
      swish_number: '',
      swish_enabled: false,
      qliro_api_key: '',
      qliro_secret: '',
      qliro_merchant_id: '',
      qliro_sandbox: true,
      qliro_enabled: false,
      qliro_use_prod_env: false,
      qliro_prod_enabled: false,
      qliro_dev_api_url: 'https://playground.qliro.com',
      qliro_prod_api_url: 'https://api.qliro.com',
      // Debug settings
      debug_extended_logs: false,
      // Maps/API
      google_maps_api_key: '',
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
    const authResult = await requireAuthAPI('admin');

    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;

    const updates = await request.json();

    // Define which keys belong to which category
    const categoryMapping: Record<string, string> = {
      // Email settings
      use_sendgrid: 'email',
      sendgrid_api_key: 'email',
      use_smtp: 'email',
      smtp_host: 'email',
      smtp_port: 'email',
      smtp_username: 'email',
      smtp_password: 'email',
      smtp_secure: 'email',
      from_name: 'email',
      from_email: 'email',
      reply_to: 'email',
      school_email: 'email',
      force_internal_only: 'email',
      fallback_to_internal: 'email',
      
      // Site settings
      site_domain: 'general',
      public_app_url: 'general',
      site_name: 'general',
      schoolname: 'general',
      school_phonenumber: 'general',
      internal_messages_enabled: 'general',
      google_maps_api_key: 'general',
      
      // Payment settings
      swish_number: 'payment',
      swish_enabled: 'payment',
      qliro_api_key: 'payment',
      qliro_api_secret: 'payment',
      qliro_secret: 'payment',
      qliro_shared_secret: 'payment',
      qliro_merchant_id: 'payment',
      qliro_sandbox: 'payment',
      qliro_environment: 'payment',
      qliro_enabled: 'payment',
      qliro_use_prod_env: 'payment',
      qliro_prod_enabled: 'payment',
      qliro_prod_api_key: 'payment',
      qliro_prod_api_secret: 'payment',
      qliro_prod_shared_secret: 'payment',
      qliro_dev_api_url: 'payment',
      qliro_prod_api_url: 'payment',
      qliro_api_url: 'payment',
      qliro_webhook_secret: 'payment',
      qliro_test_passed: 'payment',
      qliro_last_test_date: 'payment',
      qliro_dev_api_key: 'payment',
      // Debug settings
      debug_extended_logs: 'general',
    };

    // Update or insert each setting
    for (const [key, value] of Object.entries(updates)) {
      const category = categoryMapping[key] || 'general';
      let stringValue: string;

      if (key === 'opening_hours') {
        // Validate and normalize opening_hours JSON
        try {
          const normalized = typeof value === 'string' ? withDefaults(JSON.parse(value)) : withDefaults(value as any);
          stringValue = JSON.stringify(normalized);
        } catch (e) {
          return NextResponse.json({ error: 'Invalid opening_hours payload' }, { status: 400 });
        }
      } else {
        stringValue = typeof value === 'boolean' ? value.toString() : String(value);
      }

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
