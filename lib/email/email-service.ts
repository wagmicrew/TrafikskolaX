import { db } from '@/lib/db';
import { emailTemplates, emailTriggers, emailReceivers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export type EmailTriggerType = 
  | 'user_login'
  | 'forgot_password'
  | 'new_user'
  | 'new_booking'
  | 'moved_booking'
  | 'cancelled_booking'
  | 'booking_reminder'
  | 'credits_reminder'
  | 'payment_reminder'
  | 'payment_confirmation_request'
  | 'payment_confirmed'
  | 'payment_declined'
  | 'feedback_received'
  | 'teacher_daily_bookings'
  | 'teacher_feedback_reminder';

export type EmailReceiverType = 'student' | 'teacher' | 'admin' | 'specific_user';

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
  // Wrap the content in a div with class for red theme
  return `
    <div style="background-color: black; color: red; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <img src="https://dintrafikskolahlm.se/logo.png" alt="Logo" style="display: block; width: 150px; margin: 0 auto 20px;" />
        ${htmlContent}
      </div>
    </div>
  `;
}

export class EmailService {
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
      const processedSubject = this.processTemplate(emailTemplate.subject, context);
const processedHtml = this.processTemplate(applyRedTemplate(emailTemplate.htmlContent), context);

      // Send email to each receiver
      const sendPromises = receivers.map(async (receiver) => {
        const recipientEmail = this.getRecipientEmail(receiver.receiverType, context, receiver.specificUserId);
        
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
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error sending triggered email:', error);
      return false;
    }
  }

  /**
   * Process template variables
   */
  private static processTemplate(template: string, context: EmailContext): string {
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

    // Replace custom data
    if (context.customData) {
      Object.entries(context.customData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processed = processed.replace(regex, String(value));
      });
    }

    // Replace system variables
    processed = processed.replace(/\{\{appUrl\}\}/g, process.env.NEXT_PUBLIC_APP_URL || 'https://dintrafikskolahlm.se');
    processed = processed.replace(/\{\{schoolName\}\}/g, 'Din Trafikskola HLM');
    processed = processed.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());

    return processed;
  }

  /**
   * Get recipient email based on receiver type
   */
  private static getRecipientEmail(
    receiverType: EmailReceiverType,
    context: EmailContext,
    specificUserId?: string | null
  ): string | null {
    switch (receiverType) {
      case 'student':
        return context.user?.email || null;
      case 'teacher':
        return context.teacher?.email || null;
      case 'admin':
        return context.admin?.email || process.env.ADMIN_EMAIL || null;
      case 'specific_user':
        // TODO: Fetch specific user email from database if needed
        return null;
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
      credits_reminder: 'general',
      payment_reminder: 'payment_confirmation',
      payment_confirmation_request: 'payment_confirmation',
      payment_confirmed: 'payment_confirmation',
      payment_declined: 'payment_confirmation',
      feedback_received: 'general',
      teacher_daily_bookings: 'general',
      teacher_feedback_reminder: 'general',
    };

    return mappings[triggerType] || 'general';
  }
}
