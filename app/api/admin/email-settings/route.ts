import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';
import { logger } from '@/lib/logging/logger';

// Default email settings
const DEFAULT_EMAIL_SETTINGS = {
  use_sendgrid: 'false',
  sendgrid_api_key: '',
  use_smtp: 'true',
  smtp_host: 'mailcluster.loopia.se',
  smtp_port: '587',
  smtp_secure: 'false',
  smtp_username: 'admin@dintrafikskolahlm.se',
  smtp_password: '',
  from_name: 'Din Trafikskola HLM',
  from_email: 'admin@dintrafikskolahlm.se',
  reply_to: 'info@dintrafikskolahlm.se',
  admin_email: 'admin@dintrafikskolahlm.se',
  school_email: 'school@dintrafikskolahlm.se',
  fallback_to_internal: 'true',
  force_internal_only: 'false'
};

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;

    // Get all email settings
    const settings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.category, 'email'));

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value || '';
      return acc;
    }, {} as Record<string, string>);

    // Merge with defaults for any missing settings
    const emailSettings = { ...DEFAULT_EMAIL_SETTINGS, ...settingsMap };

    logger.info('email', 'Email settings retrieved', { userId: user.userId });

    return NextResponse.json({ 
      settings: emailSettings,
      message: 'Email settings retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    const message = (error as Error)?.message ?? 'Unknown error';
    logger.error('email', 'Failed to fetch email settings', { error: message });
    return NextResponse.json({ error: 'Failed to fetch email settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }

    // Update each setting
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      if (!DEFAULT_EMAIL_SETTINGS.hasOwnProperty(key)) {
        return; // Skip unknown settings
      }

      // First try to update existing setting
      const result = await db
        .update(siteSettings)
        .set({ 
          value: String(value), 
          updatedAt: new Date() 
        })
        .where(eq(siteSettings.key, key))
        .returning();

      // If no rows were updated, insert new setting
      if (result.length === 0) {
        await db
          .insert(siteSettings)
          .values({
            key,
            value: String(value),
            category: 'email',
            description: `Email setting: ${key}`
          });
      }
    });

    await Promise.all(updatePromises);

    // Clear the email service cache to reload configuration
    EnhancedEmailService.clearConfigCache();

    logger.info('email', 'Email settings updated', { 
      userId: user.userId,
      settingsCount: Object.keys(settings).length 
    });

    return NextResponse.json({ 
      message: 'Email settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    const message = (error as Error)?.message ?? 'Unknown error';
    logger.error('email', 'Failed to update email settings', { error: message });
    return NextResponse.json({ error: 'Failed to update email settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;

    const body = await request.json();
    const { action, testEmail, templateId } = body;

    if (action === 'test_connection') {
      // Test email connection by sending a test email
      const testEmailAddress = testEmail || user.email || 'admin@dintrafikskolahlm.se';
      
      try {
        const success = await EnhancedEmailService.sendEmail({
          to: testEmailAddress,
          subject: '[TEST] Email System Test - Din Trafikskola HLM',
          html: `
            <h2>Email System Test</h2>
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            <p><strong>Test performed:</strong> ${new Date().toLocaleString('sv-SE')}</p>
            <p><strong>User:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 0; color: #166534;"><strong>✅ Email system is working correctly!</strong></p>
            </div>
          `,
          messageType: 'test'
        });

        if (success) {
          logger.info('email', 'Test email sent successfully', { 
            to: testEmailAddress,
            userId: user.userId 
          });
          return NextResponse.json({ 
            message: `Test email sent successfully to ${testEmailAddress}`,
            success: true 
          });
        } else {
          logger.warn('email', 'Test email failed to send', { 
            to: testEmailAddress,
            userId: user.userId 
          });
          return NextResponse.json({ 
            message: 'Test email failed to send. Check logs for details.',
            success: false 
          });
        }
      } catch (error) {
        const message = (error as Error)?.message ?? 'Unknown error';
        logger.error('email', 'Test email error', { 
          to: testEmailAddress,
          error: message,
          userId: user.userId 
        });
        return NextResponse.json({ 
          message: `Test email failed: ${message}`,
          success: false 
        });
      }
    }

    if (action === 'test_template' && templateId) {
      // Test a specific email template
      const testEmailAddress = testEmail || user.email || 'admin@dintrafikskolahlm.se';
      
      try {
        const success = await EnhancedEmailService.testEmailTemplate(templateId, testEmailAddress);
        
        if (success) {
          logger.info('email', 'Test template email sent successfully', { 
            templateId,
            to: testEmailAddress,
            userId: user.userId 
          });
          return NextResponse.json({ 
            message: `Test template email sent successfully to ${testEmailAddress}`,
            success: true 
          });
        } else {
          logger.warn('email', 'Test template email failed to send', { 
            templateId,
            to: testEmailAddress,
            userId: user.userId 
          });
          return NextResponse.json({ 
            message: 'Test template email failed to send. Check logs for details.',
            success: false 
          });
        }
      } catch (error) {
        const message = (error as Error)?.message ?? 'Unknown error';
        logger.error('email', 'Test template email error', { 
          templateId,
          to: testEmailAddress,
          error: message,
          userId: user.userId 
        });
        return NextResponse.json({ 
          message: `Test template email failed: ${message}`,
          success: false 
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in email settings POST:', error);
    const message = (error as Error)?.message ?? 'Unknown error';
    logger.error('email', 'Email settings POST action failed', { error: message });
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
