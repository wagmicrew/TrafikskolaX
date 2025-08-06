import { db } from '@/lib/db';
import { siteSettings, emailTemplates, emailReceivers, internalMessages, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { logger } from '@/lib/logging/logger';

export type EmailTriggerType = 
  | 'user_login'
  | 'forgot_password'
  | 'new_user'
  | 'new_booking'
  | 'moved_booking'
  | 'cancelled_booking'
  | 'booking_reminder'
  | 'booking_confirmed'
  | 'credits_reminder'
  | 'payment_reminder'
  | 'payment_confirmation_request'
  | 'payment_confirmed'
  | 'payment_declined'
  | 'feedback_received'
  | 'teacher_daily_bookings'
  | 'teacher_feedback_reminder'
  | 'awaiting_school_confirmation'
  | 'pending_school_confirmation'
  | 'new_password';

export type EmailReceiverType = 'student' | 'teacher' | 'admin' | 'school' | 'specific_user';

interface EmailConfig {
  // Email method priority: 'sendgrid' | 'smtp' | 'internal'
  emailMethod: string;
  
  // SendGrid settings
  sendgridApiKey?: string;
  useSendgrid: boolean;
  
  // SMTP settings
  useSmtp: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  
  // Email addresses
  fromName: string;
  fromEmail: string;
  replyTo: string;
  adminEmail: string;
  schoolEmail: string; // New school email setting
  
  // Internal messaging fallback
  fallbackToInternal: boolean;
  
  // Force internal only (admin override)
  forceInternalOnly: boolean;
}

interface EmailContext {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  booking?: {
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    lessonTypeName: string;
    totalPrice: string;
    paymentMethod?: string;
    swishUUID?: string;
  };
  teacher?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  admin?: {
    email: string;
  };
  school?: {
    email: string;
  };
  customData?: Record<string, any>;
}

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  userId?: string;
  bookingId?: string;
  messageType?: string;
}

export class EnhancedEmailService {
  private static config: EmailConfig | null = null;

  /**
   * Get email configuration from database
   */
  private static async getEmailConfig(): Promise<EmailConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const settings = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.category, 'email'));

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string | null>);

      // Check if admin has forced internal-only mode
      const forceInternalOnly = settingsMap['force_internal_only'] === 'true';
      
      // Debug logging
      console.log('Email settings debug:', {
        use_smtp: settingsMap['use_smtp'],
        smtp_host: settingsMap['smtp_host'],
        smtp_username: settingsMap['smtp_username'],
        smtp_password: settingsMap['smtp_password'] ? '***HIDDEN***' : null,
        use_sendgrid: settingsMap['use_sendgrid'],
        sendgrid_api_key: settingsMap['sendgrid_api_key'] ? '***HIDDEN***' : null,
        force_internal_only: forceInternalOnly
      });
      
      // Determine email method priority - SMTP first, then SendGrid, then internal
      let emailMethod = 'internal';
      if (!forceInternalOnly) {
        // Check SMTP configuration completeness
        const smtpConfigComplete = settingsMap['use_smtp'] === 'true' && 
                                  settingsMap['smtp_host'] && 
                                  settingsMap['smtp_username'] && 
                                  settingsMap['smtp_password'];
        
        const sendgridConfigComplete = settingsMap['use_sendgrid'] === 'true' && 
                                      settingsMap['sendgrid_api_key'];
        
        if (smtpConfigComplete) {
          emailMethod = 'smtp';
          console.log('✅ SMTP configuration complete - using SMTP');
        } else if (sendgridConfigComplete) {
          emailMethod = 'sendgrid';
          console.log('✅ SendGrid configuration complete - using SendGrid');
        } else {
          console.log('⚠️ No complete email configuration found - using internal messaging');
        }
      } else {
        console.log('🔒 Force internal only mode enabled');
      }

      this.config = {
        emailMethod,
        
        // SendGrid
        sendgridApiKey: settingsMap['sendgrid_api_key'] || process.env.SENDGRID_API_KEY || undefined,
        useSendgrid: settingsMap['use_sendgrid'] === 'true',
        
        // SMTP
        useSmtp: settingsMap['use_smtp'] === 'true',
        smtpHost: settingsMap['smtp_host'] || undefined,
        smtpPort: settingsMap['smtp_port'] ? parseInt(settingsMap['smtp_port']) : 587,
        smtpSecure: settingsMap['smtp_secure'] === 'true',
        smtpUsername: settingsMap['smtp_username'] || settingsMap['smtp_user'] || undefined,
        smtpPassword: settingsMap['smtp_password'] || undefined,
        
        // Email addresses
        fromName: settingsMap['from_name'] || 'Din Trafikskola HLM',
        fromEmail: settingsMap['from_email'] || 'noreply@dintrafikskolahlm.se',
        replyTo: settingsMap['reply_to'] || 'info@dintrafikskolahlm.se',
        adminEmail: settingsMap['admin_email'] || 'admin@dintrafikskolahlm.se',
        schoolEmail: settingsMap['school_email'] || 'school@dintrafikskolahlm.se', // New setting
        
        // Fallback
        fallbackToInternal: settingsMap['fallback_to_internal'] !== 'false',
        
        // Force internal only
        forceInternalOnly
      };

      logger.info('email', 'Email configuration loaded', {
        method: this.config.emailMethod,
        hasApiKey: !!this.config.sendgridApiKey,
        hasSmtp: !!(this.config.smtpHost && this.config.smtpUsername),
        fallbackEnabled: this.config.fallbackToInternal
      });

      return this.config;
    } catch (error) {
      logger.error('email', 'Failed to load email configuration', { error: error.message });
      
      // Return default configuration
      return {
        emailMethod: 'internal',
        useSendgrid: false,
        useSmtp: false,
        forceInternalOnly: false,
        fromName: 'Din Trafikskola HLM',
        fromEmail: 'noreply@dintrafikskolahlm.se',
        replyTo: 'info@dintrafikskolahlm.se',
        adminEmail: 'admin@dintrafikskolahlm.se',
        schoolEmail: 'school@dintrafikskolahlm.se',
        fallbackToInternal: true
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private static async sendViaSendGrid(options: EmailOptions, config: EmailConfig): Promise<boolean> {
    try {
      if (!config.sendgridApiKey) {
        throw new Error('SendGrid API key not configured');
      }

      sgMail.setApiKey(config.sendgridApiKey);

      const msg = {
        to: options.to,
        from: {
          email: config.fromEmail,
          name: options.fromName || config.fromName
        },
        replyTo: options.replyTo || config.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text
      };

      await sgMail.send(msg);
      
      logger.info('email', 'Email sent via SendGrid', {
        to: options.to,
        subject: options.subject,
        messageType: options.messageType
      }, options.userId);

      return true;
    } catch (error) {
      logger.error('email', 'SendGrid email failed', {
        to: options.to,
        subject: options.subject,
        error: error.message
      }, options.userId);
      
      return false;
    }
  }

  /**
   * Send email via SMTP
   */
  private static async sendViaSmtp(options: EmailOptions, config: EmailConfig): Promise<boolean> {
    try {
      if (!config.smtpHost || !config.smtpUsername || !config.smtpPassword) {
        throw new Error('SMTP configuration incomplete');
      }

      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: config.smtpSecure || false,
        requireTLS: !config.smtpSecure,
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      await transporter.verify();

      const mailOptions = {
        from: `"${options.fromName || config.fromName}" <${config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
        replyTo: options.replyTo || config.replyTo
      };

      await transporter.sendMail(mailOptions);
      
logger.info('email', 'Email sent via SMTP', {
        to: options.to,
        subject: options.subject,
        messageType: options.messageType,
        emailId: options.messageType,
        sentAt: new Date().toISOString()
      }, options.userId);

      return true;
    } catch (error) {
      logger.error('email', 'SMTP email failed', {
        to: options.to,
        subject: options.subject,
        error: error.message
      }, options.userId);
      
      return false;
    }
  }

  /**
   * Save email as internal message (fallback)
   */
  private static async saveAsInternalMessage(options: EmailOptions): Promise<boolean> {
    try {
      // Find recipient user
      const recipient = await db
        .select()
        .from(users)
        .where(eq(users.email, options.to))
        .limit(1);

      if (!recipient[0]) {
        logger.warn('email', 'Cannot save as internal message - user not found', {
          email: options.to
        });
        return false;
      }

      // Get system/admin user
      const systemUser = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);

      if (!systemUser[0]) {
        logger.error('email', 'Cannot save as internal message - no admin user found');
        return false;
      }

      // Save as internal message
      await db.insert(internalMessages).values({
        fromUserId: systemUser[0].id,
        toUserId: recipient[0].id,
        subject: options.subject,
        message: options.html || options.text || '',
        bookingId: options.bookingId || null,
        messageType: options.messageType || 'general'
      });

      logger.info('email', 'Email saved as internal message', {
        to: options.to,
        subject: options.subject,
        messageType: options.messageType
      }, options.userId);

      return true;
    } catch (error) {
      logger.error('email', 'Failed to save as internal message', {
        to: options.to,
        subject: options.subject,
        error: error.message
      }, options.userId);
      
      return false;
    }
  }

  /**
   * Send email with fallback support
   */
  public static async sendEmail(options: EmailOptions): Promise<boolean> {
    // Clear cache to ensure fresh config for debugging
    this.config = null;
    const config = await this.getEmailConfig();
    
    logger.info('email', 'Attempting to send email', {
      to: options.to,
      subject: options.subject,
      method: config.emailMethod,
      messageType: options.messageType
    }, options.userId);

    let success = false;

    // If force internal only is enabled, skip email providers
    if (config.forceInternalOnly) {
      logger.info('email', 'Force internal only mode enabled - saving as internal message', { to: options.to });
      success = await this.saveAsInternalMessage(options);
    } else {
      // Try primary method first
      if (config.emailMethod === 'sendgrid' && config.useSendgrid) {
        success = await this.sendViaSendGrid(options, config);
      } else if (config.emailMethod === 'smtp' && config.useSmtp) {
        success = await this.sendViaSmtp(options, config);
      }
    }

    // Try alternative methods if primary failed and not in force internal mode
    if (!success && !config.forceInternalOnly) {
      if (config.emailMethod !== 'sendgrid' && config.useSendgrid) {
        logger.info('email', 'Trying SendGrid as fallback', { to: options.to });
        success = await this.sendViaSendGrid(options, config);
      } else if (config.emailMethod !== 'smtp' && config.useSmtp) {
        logger.info('email', 'Trying SMTP as fallback', { to: options.to });
        success = await this.sendViaSmtp(options, config);
      }
    }

    // Final fallback to internal messaging
    if (!success && config.fallbackToInternal) {
      logger.info('email', 'Using internal messaging as final fallback', { to: options.to });
      success = await this.saveAsInternalMessage(options);
    }

    if (!success) {
      logger.error('email', 'All email delivery methods failed', {
        to: options.to,
        subject: options.subject
      }, options.userId);
    }

    return success;
  }

  /**
   * Send triggered email based on template
   */
  public static async sendTriggeredEmail(
    triggerType: EmailTriggerType,
    context: EmailContext
  ): Promise<boolean> {
    try {
      logger.info('email', `Email trigger fired: ${triggerType}`, {
        triggerType,
        userId: context.user?.id,
        bookingId: context.booking?.id
      });

      // Get email template
      const template = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.triggerType, triggerType),
            eq(emailTemplates.isActive, true)
          )
        )
        .limit(1);

      if (!template[0]) {
        logger.warn('email', `No active template found for trigger: ${triggerType}`);
        return false;
      }

      // Get receivers for this template
      const receivers = await db
        .select()
        .from(emailReceivers)
        .where(eq(emailReceivers.templateId, template[0].id));

      if (!receivers.length) {
        logger.warn('email', `No receivers configured for template: ${template[0].id}`);
        return false;
      }

      const config = await this.getEmailConfig();

      // Process template content
      const processedSubject = await this.processTemplate(template[0].subject, context, config);
      const processedHtml = await this.processTemplate(
        this.applyEmailTemplate(template[0].htmlContent), 
        context, 
        config
      );

      // Send to each receiver
      const sendPromises = receivers.map(async (receiver) => {
        const recipientEmail = this.getRecipientEmail(receiver.receiverType, context, config);
        
        if (!recipientEmail) {
          logger.warn('email', `No email address for receiver type: ${receiver.receiverType}`);
          return false;
        }

        return await this.sendEmail({
          to: recipientEmail,
          subject: processedSubject,
          html: processedHtml,
          userId: context.user?.id,
          bookingId: context.booking?.id,
          messageType: this.mapTriggerToMessageType(triggerType)
        });
      });

      const results = await Promise.all(sendPromises);
      const allSuccess = results.every(result => result === true);

      logger.info('email', `Email trigger ${triggerType} completed`, {
        triggerType,
        totalReceivers: results.length,
        successCount: results.filter(r => r).length,
        allSuccess
      });

      return allSuccess;
    } catch (error) {
      logger.error('email', `Email trigger ${triggerType} failed`, {
        triggerType,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Process template variables
   */
  private static async processTemplate(template: string, context: EmailContext, config: EmailConfig): Promise<string> {
    let processed = template;

    // User variables
    if (context.user) {
      processed = processed.replace(/\{\{user\.firstName\}\}/g, context.user.firstName);
      processed = processed.replace(/\{\{user\.lastName\}\}/g, context.user.lastName);
      processed = processed.replace(/\{\{user\.email\}\}/g, context.user.email);
      processed = processed.replace(/\{\{user\.fullName\}\}/g, `${context.user.firstName} ${context.user.lastName}`);
    }

    // Booking variables
    if (context.booking) {
      processed = processed.replace(/\{\{booking\.id\}\}/g, context.booking.id);
      processed = processed.replace(/\{\{booking\.scheduledDate\}\}/g, context.booking.scheduledDate);
      processed = processed.replace(/\{\{booking\.startTime\}\}/g, context.booking.startTime);
      processed = processed.replace(/\{\{booking\.endTime\}\}/g, context.booking.endTime);
      processed = processed.replace(/\{\{booking\.lessonTypeName\}\}/g, context.booking.lessonTypeName);
      processed = processed.replace(/\{\{booking\.totalPrice\}\}/g, context.booking.totalPrice);
      processed = processed.replace(/\{\{booking\.swishUUID\}\}/g, context.booking.swishUUID || '');
    }

    // Teacher variables
    if (context.teacher) {
      processed = processed.replace(/\{\{teacher\.firstName\}\}/g, context.teacher.firstName);
      processed = processed.replace(/\{\{teacher\.lastName\}\}/g, context.teacher.lastName);
      processed = processed.replace(/\{\{teacher\.fullName\}\}/g, `${context.teacher.firstName} ${context.teacher.lastName}`);
    }

    // Custom data
    if (context.customData) {
      Object.entries(context.customData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processed = processed.replace(regex, String(value));
      });
    }

    // Get schoolname from database
    let schoolname = 'Din Trafikskola Hässleholm';
    try {
      const schoolnameSetting = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, 'schoolname'))
        .limit(1);
      
      if (schoolnameSetting.length > 0) {
        schoolname = schoolnameSetting[0].value || 'Din Trafikskola Hässleholm';
      }
    } catch (error) {
      logger.warn('email', 'Failed to fetch schoolname from database, using default', { error });
    }

    // Get school phonenumber from database
    let schoolPhonenumber = '0760-38 91 92';
    try {
      const schoolPhonenumberSetting = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, 'school_phonenumber'))
        .limit(1);
      
      if (schoolPhonenumberSetting.length > 0 && schoolPhonenumberSetting[0].value) {
        schoolPhonenumber = schoolPhonenumberSetting[0].value;
      }
    } catch (error) {
      logger.warn('email', 'Failed to fetch school phonenumber from database, using default', { error });
    }

    // System variables
    processed = processed.replace(/\{\{appUrl\}\}/g, process.env.NEXT_PUBLIC_APP_URL || 'https://dintrafikskolahlm.se');
    processed = processed.replace(/\{\{schoolName\}\}/g, schoolname);
    processed = processed.replace(/\{\{schoolEmail\}\}/g, config.schoolEmail);
    processed = processed.replace(/\{\{schoolPhone\}\}/g, schoolPhonenumber);
    processed = processed.replace(/\{\{adminEmail\}\}/g, config.adminEmail);
    processed = processed.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());
    processed = processed.replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('sv-SE'));

    return processed;
  }

  /**
   * Apply branded email template
   */
  private static applyEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Din Trafikskola HLM</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 20px; text-align: center;">
            <div style="background-color: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; display: inline-block;">
              <div style="color: #ffffff; margin: 0; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 2px;">Din Trafikskola</div>
                <div style="font-size: 16px; font-weight: normal;">Hässleholm</div>
              </div>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <div style="color: #374151; line-height: 1.6; font-size: 16px;">
              ${content}
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{appUrl}}/dashboard" 
                 style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                📚 Gå till Min Sida
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                📧 <a href="mailto:{{schoolEmail}}" style="color: #dc2626; text-decoration: none;">{{schoolEmail}}</a> | 
                📞 <a href="tel:{{schoolPhone}}" style="color: #dc2626; text-decoration: none;">{{schoolPhone}}</a>
              </p>
              <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
                © {{currentYear}} Din Trafikskola Hässleholm. Alla rättigheter förbehållna.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get recipient email based on receiver type
   */
  private static getRecipientEmail(
    receiverType: EmailReceiverType,
    context: EmailContext,
    config: EmailConfig
  ): string | null {
    switch (receiverType) {
      case 'student':
        return context.user?.email || null;
      case 'teacher':
        return context.teacher?.email || null;
      case 'admin':
        return context.admin?.email || config.adminEmail;
      case 'school':
        return config.schoolEmail;
      case 'specific_user':
        // TODO: Implement specific user lookup
        return null;
      default:
        return null;
    }
  }

  /**
   * Map trigger type to message type
   */
  private static mapTriggerToMessageType(triggerType: EmailTriggerType): string {
    const mappings: Record<EmailTriggerType, string> = {
      user_login: 'general',
      forgot_password: 'general',
      new_user: 'general',
      new_booking: 'booking_related',
      moved_booking: 'booking_related',
      cancelled_booking: 'booking_related',
      booking_reminder: 'booking_related',
      booking_confirmed: 'booking_related',
      credits_reminder: 'general',
      payment_reminder: 'payment_confirmation',
      payment_confirmation_request: 'payment_confirmation',
      payment_confirmed: 'payment_confirmation',
      payment_declined: 'payment_confirmation',
      feedback_received: 'general',
      teacher_daily_bookings: 'general',
      teacher_feedback_reminder: 'general',
      awaiting_school_confirmation: 'booking_related',
      pending_school_confirmation: 'booking_related',
      new_password: 'general'
    };

    return mappings[triggerType] || 'general';
  }

  /**
   * Test email template
   */
  public static async testEmailTemplate(
    templateId: string,
    testEmail: string
  ): Promise<boolean> {
    try {
      // Get template
      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1);

      if (!template[0]) {
        throw new Error('Template not found');
      }

      // Mock context for testing
      const mockContext: EmailContext = {
        user: {
          id: 'test-user-123',
          email: testEmail,
          firstName: 'Test',
          lastName: 'Användare',
          role: 'student'
        },
        booking: {
          id: 'test-booking-456',
          scheduledDate: '2024-01-15',
          startTime: '14:00',
          endTime: '15:00',
          lessonTypeName: 'B-körkort 45 min',
          totalPrice: '695'
        },
        customData: {
          temporaryPassword: 'TempPass123!'
        }
      };

      const config = await this.getEmailConfig();
      const processedSubject = `[TEST] ${await this.processTemplate(template[0].subject, mockContext, config)}`;
      const processedHtml = await this.processTemplate(
        this.applyEmailTemplate(template[0].htmlContent),
        mockContext,
        config
      );

      return await this.sendEmail({
        to: testEmail,
        subject: processedSubject,
        html: processedHtml,
        messageType: 'test'
      });
    } catch (error) {
      logger.error('email', 'Test email failed', {
        templateId,
        testEmail,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Clear cached configuration (for admin updates)
   */
  public static clearConfigCache(): void {
    this.config = null;
    logger.info('email', 'Email configuration cache cleared');
  }
}
