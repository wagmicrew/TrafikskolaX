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

    console.log('🚀 Initializing email settings...');

    const emailSettings = [
      {
        key: 'use_sendgrid',
        value: 'false',
        category: 'email',
        description: 'Enable SendGrid for email delivery'
      },
      {
        key: 'sendgrid_api_key',
        value: '',
        category: 'email',
        description: 'SendGrid API key'
      },
      {
        key: 'use_smtp',
        value: 'false',
        category: 'email',
        description: 'Enable SMTP for email delivery'
      },
      {
        key: 'smtp_host',
        value: 'mailcluster.loopia.se',
        category: 'email',
        description: 'SMTP server hostname'
      },
      {
        key: 'smtp_port',
        value: '587',
        category: 'email',
        description: 'SMTP server port'
      },
      {
        key: 'smtp_username',
        value: 'admin@dintrafikskolahlm.se',
        category: 'email',
        description: 'SMTP username'
      },
      {
        key: 'smtp_password',
        value: '',
        category: 'email',
        description: 'SMTP password'
      },
      {
        key: 'smtp_secure',
        value: 'false',
        category: 'email',
        description: 'Use secure connection for SMTP'
      },
      {
        key: 'from_name',
        value: 'Din Trafikskola Hässleholm',
        category: 'email',
        description: 'Email sender name'
      },
      {
        key: 'from_email',
        value: 'noreply@dintrafikskolahlm.se',
        category: 'email',
        description: 'Email sender address'
      },
      {
        key: 'reply_to',
        value: 'info@dintrafikskolahlm.se',
        category: 'email',
        description: 'Reply-to email address'
      },
      {
        key: 'school_email',
        value: 'info@dintrafikskolahlm.se',
        category: 'email',
        description: 'School email address for contact forms'
      },
      {
        key: 'force_internal_only',
        value: 'false',
        category: 'email',
        description: 'Force internal messaging only (for testing)'
      },
      {
        key: 'fallback_to_internal',
        value: 'true',
        category: 'email',
        description: 'Fallback to internal messaging if email fails'
      }
    ];

    const results = [];

    for (const setting of emailSettings) {
      // Check if setting already exists
      const existing = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, setting.key))
        .limit(1);

      if (existing.length === 0) {
        // Insert new setting
        await db.insert(siteSettings).values({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          description: setting.description,
          isEnv: false,
        });
        results.push({ key: setting.key, action: 'added' });
        console.log(`✅ Added: ${setting.key}`);
      } else {
        results.push({ key: setting.key, action: 'already_exists' });
        console.log(`ℹ️ Already exists: ${setting.key}`);
      }
    }

    console.log('🎉 Email settings initialization completed!');

    return NextResponse.json({ 
      success: true, 
      message: 'Email settings initialized successfully',
      results,
      summary: {
        total: emailSettings.length,
        added: results.filter(r => r.action === 'added').length,
        alreadyExists: results.filter(r => r.action === 'already_exists').length
      }
    });

  } catch (error) {
    console.error('❌ Error initializing email settings:', error);
    return NextResponse.json(
      { error: 'Failed to initialize email settings' },
      { status: 500 }
    );
  }
} 