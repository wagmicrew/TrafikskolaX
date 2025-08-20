/**
 * Unified Email Service - Consolidates all email functionality
 * Replaces: email-service.ts, enhanced-email-service.ts, notification-service.ts, sendEmail.ts
 */

import { db } from '@/lib/db';
import { emailTemplates, emailReceivers, emailTriggers, siteSettings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { logger } from '@/lib/logging/logger';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api/types';

// Email trigger types
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
  | 'new_password'
  | 'swish_payment_verification'
  | 'handledar_booking_confirmed'
  | 'handledar_payment_reminder'
  | 'booking_payment_reminder'
  | 'package_payment_reminder';

export type EmailReceiverType = 'student' | 'teacher' | 'admin' | 'school' | 'specific_user' | 'supervisor';

// Email context interface
export interface EmailContext {
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
    teacherName?: string;
    studentName?: string;
  };
  payment?: {
    amount: string;
    method: string;
    transactionId?: string;
    dueDate?: string;
  };
  credits?: {
    current: number;
    used: number;
    remaining: number;
  };
  customData?: Record<string, any>;
}

// Email options interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
}

// Email providers enum
export enum EmailProvider {
  SENDGRID = 'sendgrid',
  SMTP = 'smtp'
}

class UnifiedEmailService {
  private sendgridClient: typeof sgMail | null = null;
  private nodemailerTransporter: nodemailer.Transporter | null = null;
  private settings: any = null;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize email providers based on settings
   */
  private async initializeProviders(): Promise<void> {
    try {
      // Get email settings from database
      const settings = await this.getEmailSettings();
      
      // Initialize SendGrid if API key is available
      if (settings.sendgrid_api_key) {
        sgMail.setApiKey(settings.sendgrid_api_key);
        this.sendgridClient = sgMail;
        logger.info('SendGrid client initialized');
      }

      // Initialize SMTP if credentials are available
      if (settings.smtp_host && settings.smtp_user && settings.smtp_pass) {
        this.nodemailerTransporter = nodemailer.createTransporter({
          host: settings.smtp_host,
          port: parseInt(settings.smtp_port) || 587,
          secure: false,
          auth: {
            user: settings.smtp_user,
            pass: settings.smtp_pass,
          },
        });
        logger.info('SMTP transporter initialized');
      }

      this.settings = settings;
    } catch (error) {
      logger.error('Failed to initialize email providers:', error);
    }
  }

  /**
   * Get email settings from database
   */
  private async getEmailSettings(): Promise<any> {
    try {
      const settings = await db.select().from(siteSettings);
      return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      logger.error('Failed to get email settings:', error);
      return {};
    }
  }

  /**
   * Determine which email provider to use
   */
  private getPreferredProvider(): EmailProvider {
    if (this.sendgridClient && this.settings?.sendgrid_api_key) {
      return EmailProvider.SENDGRID;
    }
    if (this.nodemailerTransporter) {
      return EmailProvider.SMTP;
    }
    throw new Error('No email provider configured');
  }

  /**
   * Send email using SendGrid
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<void> {
    if (!this.sendgridClient) {
      throw new Error('SendGrid not initialized');
    }

    const msg = {
      to: Array.isArray(options.to) ? options.to : [options.to],
      from: options.from || this.settings.contact_email || 'noreply@trafikskolax.se',
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        type: att.contentType,
      })),
    };

    await this.sendgridClient.send(msg);
  }

  /**
   * Send email using SMTP
   */
  private async sendWithSMTP(options: EmailOptions): Promise<void> {
    if (!this.nodemailerTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const mailOptions = {
      from: options.from || this.settings.contact_email || 'noreply@trafikskolax.se',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    await this.nodemailerTransporter.sendMail(mailOptions);
  }

  /**
   * Send raw email
   */
  public async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      // Refresh settings if needed
      if (!this.settings) {
        await this.initializeProviders();
      }

      const provider = this.getPreferredProvider();

      switch (provider) {
        case EmailProvider.SENDGRID:
          await this.sendWithSendGrid(options);
          break;
        case EmailProvider.SMTP:
          await this.sendWithSMTP(options);
          break;
        default:
          throw new Error('No email provider available');
      }

      logger.info(`Email sent successfully via ${provider}`, {
        to: options.to,
        subject: options.subject,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send triggered email using template system
   */
  public async sendTriggeredEmail(
    triggerType: EmailTriggerType,
    context: EmailContext,
    overrideReceiver?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Check if trigger is enabled
      const trigger = await db.select()
        .from(emailTriggers)
        .where(eq(emailTriggers.triggerType, triggerType))
        .limit(1);

      if (trigger.length === 0) {
        return { success: false, error: `Email trigger '${triggerType}' not found` };
      }

      if (!trigger[0].isActive) {
        return { success: false, error: `Email trigger '${triggerType}' is disabled` };
      }

      // Get email template
      const template = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, trigger[0].templateId))
        .limit(1);

      if (template.length === 0) {
        return { success: false, error: 'Email template not found' };
      }

      // Get receivers
      const receivers = await this.getEmailReceivers(trigger[0].id, context, overrideReceiver);
      
      if (receivers.length === 0) {
        return { success: false, error: 'No email receivers found' };
      }

      // Process template with context
      const processedTemplate = this.processTemplate(template[0], context);

      // Send emails
      const emailPromises = receivers.map(receiver =>
        this.sendEmail({
          to: receiver,
          subject: processedTemplate.subject,
          html: processedTemplate.html,
          text: processedTemplate.text,
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const failures = results.filter(r => r.status === 'rejected');

      if (failures.length > 0) {
        logger.error('Some emails failed to send:', failures);
        return { 
          success: false, 
          error: `${failures.length} of ${receivers.length} emails failed to send` 
        };
      }

      return { 
        success: true, 
        message: `Email sent to ${receivers.length} recipient(s)` 
      };

    } catch (error) {
      logger.error('Failed to send triggered email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get email receivers based on trigger configuration
   */
  private async getEmailReceivers(
    triggerId: string,
    context: EmailContext,
    overrideReceiver?: string
  ): Promise<string[]> {
    if (overrideReceiver) {
      return [overrideReceiver];
    }

    const receivers = await db.select()
      .from(emailReceivers)
      .where(eq(emailReceivers.triggerId, triggerId));

    const emailAddresses: string[] = [];

    for (const receiver of receivers) {
      switch (receiver.receiverType) {
        case 'specific_user':
          if (context.user?.email) {
            emailAddresses.push(context.user.email);
          }
          break;
        case 'admin':
          const admins = await db.select({ email: users.email })
            .from(users)
            .where(eq(users.role, 'admin'));
          emailAddresses.push(...admins.map(a => a.email));
          break;
        case 'school':
          if (this.settings?.contact_email) {
            emailAddresses.push(this.settings.contact_email);
          }
          break;
        // Add more receiver types as needed
      }
    }

    return [...new Set(emailAddresses)]; // Remove duplicates
  }

  /**
   * Process email template with context variables
   */
  private processTemplate(template: any, context: EmailContext): {
    subject: string;
    html: string;
    text: string;
  } {
    const variables = {
      ...context.user,
      ...context.booking,
      ...context.payment,
      ...context.credits,
      ...context.customData,
      site_name: this.settings?.site_name || 'TrafikskolaX',
      site_url: this.settings?.site_url || 'https://trafikskolax.se',
    };

    return {
      subject: this.replaceVariables(template.subject, variables),
      html: this.replaceVariables(template.htmlContent, variables),
      text: this.replaceVariables(template.textContent || '', variables),
    };
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  }

  /**
   * Test email configuration
   */
  public async testConfiguration(): Promise<{ success: boolean; provider?: EmailProvider; error?: string }> {
    try {
      await this.initializeProviders();
      const provider = this.getPreferredProvider();

      // Send test email
      const testResult = await this.sendEmail({
        to: this.settings?.contact_email || 'test@example.com',
        subject: 'TrafikskolaX Email Configuration Test',
        text: 'This is a test email to verify email configuration.',
        html: '<p>This is a test email to verify email configuration.</p>',
      });

      if (testResult.success) {
        return { success: true, provider };
      } else {
        return { success: false, error: testResult.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const EmailService = new UnifiedEmailService();

// Convenience functions for backward compatibility
export const sendEmail = (options: EmailOptions) => EmailService.sendEmail(options);
export const sendTriggeredEmail = (trigger: EmailTriggerType, context: EmailContext, override?: string) => 
  EmailService.sendTriggeredEmail(trigger, context, override);
export const testEmailConfiguration = () => EmailService.testConfiguration();
