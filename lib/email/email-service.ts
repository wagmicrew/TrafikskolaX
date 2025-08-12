import { db } from '@/lib/db';
import { emailTemplates, emailReceivers, emailTriggers, siteSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer/universal-mailer';
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
  | 'new_password'
  | 'swish_payment_verification'
  | 'handledar_payment_reminder'
  | 'booking_payment_reminder'
  | 'package_payment_reminder';

export type EmailReceiverType = 'student' | 'teacher' | 'admin' | 'school' | 'specific_user' | 'supervisor';

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
  customData?: Record<string, any>;
}

function applyRedTemplate(htmlContent: string): string {
  // If content already contains our standard wrapper, don't wrap again
  if (htmlContent.includes('data-standard-email="1"')) {
    return htmlContent;
  }
  // Wrap the content in a div with class for red theme (logo removed as requested)
  return `
    <div style="background-color: #ffffff; color: #333333; padding: 20px; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #dc2626; border-radius: 8px; padding: 30px;">
        <div style="border-left: 4px solid #dc2626; padding-left: 16px; margin-bottom: 20px;">
          ${htmlContent}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666666; font-size: 12px;">
          <p style="margin: 0;">Med vänliga hälsningar,<br><strong style="color: #dc2626;">Din Trafikskola HLM</strong></p>
          <p style="margin: 5px 0 0 0;">E-post: info@dintrafikskolahlm.se | Telefon: 08-XXX XX XX</p>
        </div>
      </div>
    </div>
  `;
}

export class EmailService {
  /**
   * Direct send wrapper for simple emails
   */
  static async sendEmail(args: { to: string; subject: string; html: string; messageType?: string; userId?: string | null }): Promise<boolean> {
    try {
      await sendEmail({
        to: args.to,
        subject: args.subject,
        html: args.html,
        messageType: args.messageType || 'general',
      });
      return true;
    } catch (error) {
      console.error('EmailService.sendEmail failed', error);
      return false;
    }
  }
  /**
   * Send email based on trigger type
   */
  static async sendTriggeredEmail(
    triggerType: EmailTriggerType,
    context: EmailContext
  ): Promise<boolean> {
    try {
      // Get email template for this trigger
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

      if (!template.length) {
        console.error(`No active email template found for trigger: ${triggerType}`);
        return false;
      }

      const emailTemplate = template[0];

      // Get receivers for this template
      const receivers = await db
        .select()
        .from(emailReceivers)
        .where(eq(emailReceivers.templateId, emailTemplate.id));

      if (!receivers.length) {
        console.error(`No receivers configured for email template: ${emailTemplate.id}`);
        return false;
      }

      // Process template with context data
      const processedSubject = await this.processTemplate(emailTemplate.subject, context);
const processedHtml = await this.processTemplate(applyRedTemplate(emailTemplate.htmlContent), context);

      // Send email to each receiver
      const sendPromises = receivers.map(async (receiver) => {
        const recipientEmail = await this.getRecipientEmail(receiver.receiverType, context, receiver.specificUserId);
        
        if (!recipientEmail) {
          console.error(`No email address found for receiver type: ${receiver.receiverType}`);
          return false;
        }

        return await sendEmail({
          to: recipientEmail,
          subject: processedSubject,
          html: processedHtml,
          messageType: this.mapTriggerToMessageType(triggerType),
        });
      });

      const results = await Promise.all(sendPromises);
const allSuccess = results.every(result => result === true);
      const logLevel = allSuccess ? 'info' : 'error';
      logger[logLevel]('email',
        `Emails sent for trigger: ${triggerType}`,
        { results },
        context.user?.id
      );
      return allSuccess;
    } catch (error) {
      console.error('Error sending triggered email:', error);
      return false;
    }
  }

  /**
   * Process template variables
   */
  private static async processTemplate(template: string, context: EmailContext): Promise<string> {
    let processed = template;

    // Replace user variables
    if (context.user) {
      processed = processed.replace(/\{\{user\.firstName\}\}/g, context.user.firstName);
      processed = processed.replace(/\{\{user\.lastName\}\}/g, context.user.lastName);
      processed = processed.replace(/\{\{user\.email\}\}/g, context.user.email);
      processed = processed.replace(/\{\{user\.fullName\}\}/g, `${context.user.firstName} ${context.user.lastName}`);
    }

    // Replace booking variables
    if (context.booking) {
      processed = processed.replace(/\{\{booking\.id\}\}/g, context.booking.id);
      processed = processed.replace(/\{\{booking\.scheduledDate\}\}/g, context.booking.scheduledDate);
      processed = processed.replace(/\{\{booking\.startTime\}\}/g, context.booking.startTime);
      processed = processed.replace(/\{\{booking\.endTime\}\}/g, context.booking.endTime);
      processed = processed.replace(/\{\{booking\.lessonTypeName\}\}/g, context.booking.lessonTypeName);
      processed = processed.replace(/\{\{booking\.totalPrice\}\}/g, context.booking.totalPrice);
      processed = processed.replace(/\{\{booking\.swishUUID\}\}/g, context.booking.swishUUID || '');
    }

    // Replace teacher variables
    if (context.teacher) {
      processed = processed.replace(/\{\{teacher\.firstName\}\}/g, context.teacher.firstName);
      processed = processed.replace(/\{\{teacher\.lastName\}\}/g, context.teacher.lastName);
      processed = processed.replace(/\{\{teacher\.email\}\}/g, context.teacher.email);
      processed = processed.replace(/\{\{teacher\.fullName\}\}/g, `${context.teacher.firstName} ${context.teacher.lastName}`);
    }

    // Replace custom data (supports nested objects like {{links.bookingPaymentUrl}})
    if (context.customData) {
      const flatten = (obj: any, prefix = ''): Record<string, any> => {
        return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
          const val: any = (obj as any)[k];
          const keyPath = prefix ? `${prefix}.${k}` : k;
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(acc, flatten(val, keyPath));
          } else {
            acc[keyPath] = val;
          }
          return acc;
        }, {} as Record<string, any>);
      };
      const flat = flatten(context.customData);
      Object.entries(flat).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processed = processed.replace(regex, String(value));
      });
    }

    // Convenience: booking.shortId
    if (context.booking?.id) {
      processed = processed.replace(/\{\{booking\.shortId\}\}/g, context.booking.id.slice(0, 7));
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
      console.warn('Failed to fetch schoolname from database, using default', error);
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
      console.warn('Failed to fetch school phonenumber from database, using default', error);
    }

    // Replace system variables
    const standardLoginUrl = 'https://www.dintrafikskolahlm.se/login';
    processed = processed.replace(/\{\{appUrl\}\}/g, process.env.NEXT_PUBLIC_APP_URL || 'https://dintrafikskolahlm.se');
    processed = processed.replace(/\{\{loginUrl\}\}/g, standardLoginUrl);
    processed = processed.replace(/\{\{schoolName\}\}/g, schoolname);
    processed = processed.replace(/\{\{schoolPhone\}\}/g, schoolPhonenumber);
    processed = processed.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());

    return processed;
  }

  /**
   * Get recipient email based on receiver type
   */
  private static async getRecipientEmail(
    receiverType: EmailReceiverType,
    context: EmailContext,
    specificUserId?: string | null
  ): Promise<string | null> {
    switch (receiverType) {
      case 'student':
        return context.user?.email || null;
      case 'teacher':
        return context.teacher?.email || null;
      case 'admin':
        return context.admin?.email || process.env.ADMIN_EMAIL || null;
      case 'school':
        // Get school email from database
        try {
          const schoolEmailSetting = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, 'school_email'))
            .limit(1);
          
          if (schoolEmailSetting.length > 0 && schoolEmailSetting[0].value) {
            return schoolEmailSetting[0].value;
          }
        } catch (error) {
          console.warn('Failed to fetch school email from database, using default', error);
        }
        return 'school@dintrafikskolahlm.se'; // Default fallback
      case 'specific_user':
        // TODO: Fetch specific user email from database if needed
        return null;
      case 'supervisor':
        return (context as any).customData?.supervisorEmail || null;
      default:
        return null;
    }
  }

  /**
   * Map trigger type to message type for internal messaging fallback
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
      new_password: 'general',
      swish_payment_verification: 'payment_confirmation',
    };

    return mappings[triggerType] || 'general';
  }
}
