import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all email settings from database
    const settings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.category, 'email'));

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string | null>);

    // Debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      rawSettings: settingsMap,
      
      // Email configuration analysis
      emailConfig: {
        use_smtp: settingsMap['use_smtp'] === 'true',
        smtp_host: settingsMap['smtp_host'] || null,
        smtp_port: settingsMap['smtp_port'] || null,
        smtp_username: settingsMap['smtp_username'] || null,
        smtp_password: settingsMap['smtp_password'] ? '***HIDDEN***' : null,
        smtp_secure: settingsMap['smtp_secure'] === 'true',
        
        use_sendgrid: settingsMap['use_sendgrid'] === 'true',
        sendgrid_api_key: settingsMap['sendgrid_api_key'] ? '***HIDDEN***' : null,
        
        from_name: settingsMap['from_name'] || null,
        from_email: settingsMap['from_email'] || null,
        reply_to: settingsMap['reply_to'] || null,
        
        fallback_to_internal: settingsMap['fallback_to_internal'] !== 'false',
        force_internal_only: settingsMap['force_internal_only'] === 'true'
      },
      
      // Calculated priorities
      emailMethodPriority: null as string | null,
      smtpConfigComplete: false,
      sendgridConfigComplete: false,
      
      // Test results
      smtpConnectionTest: null as any,
      errors: [] as string[]
    };

    // Determine email method priority
    const forceInternalOnly = settingsMap['force_internal_only'] === 'true';
    
    if (forceInternalOnly) {
      debugInfo.emailMethodPriority = 'internal (forced)';
    } else if (settingsMap['use_smtp'] === 'true' && settingsMap['smtp_host']) {
      debugInfo.emailMethodPriority = 'smtp';
    } else if (settingsMap['use_sendgrid'] === 'true' && settingsMap['sendgrid_api_key']) {
      debugInfo.emailMethodPriority = 'sendgrid';
    } else {
      debugInfo.emailMethodPriority = 'internal (fallback)';
    }

    // Check SMTP configuration completeness
    debugInfo.smtpConfigComplete = !!(
      settingsMap['smtp_host'] &&
      settingsMap['smtp_username'] &&
      settingsMap['smtp_password']
    );

    // Check SendGrid configuration completeness
    debugInfo.sendgridConfigComplete = !!(settingsMap['sendgrid_api_key']);

    // Test SMTP connection if configured
    if (debugInfo.smtpConfigComplete && settingsMap['use_smtp'] === 'true') {
      try {
        const transporter = nodemailer.createTransporter({
          host: settingsMap['smtp_host']!,
          port: settingsMap['smtp_port'] ? parseInt(settingsMap['smtp_port']) : 587,
          secure: settingsMap['smtp_secure'] === 'true',
          auth: {
            user: settingsMap['smtp_username']!,
            pass: settingsMap['smtp_password']!
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        await transporter.verify();
        debugInfo.smtpConnectionTest = { success: true, message: 'SMTP connection successful' };
      } catch (error: any) {
        debugInfo.smtpConnectionTest = { 
          success: false, 
          error: error.message,
          code: error.code 
        };
        debugInfo.errors.push(`SMTP connection failed: ${error.message}`);
      }
    } else if (settingsMap['use_smtp'] === 'true') {
      debugInfo.errors.push('SMTP is enabled but configuration is incomplete');
    }

    // Clear config cache and get current service config
    EnhancedEmailService.clearConfigCache();

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Email debug error:', error);
    return NextResponse.json({ error: 'Failed to debug email configuration' }, { status: 500 });
  }
}
