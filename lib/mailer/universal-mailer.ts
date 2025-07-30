import { db } from '@/lib/db';
import { siteSettings, internalMessages, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  fromName?: string;
  replyTo?: string;
  userId?: string; // For internal messaging fallback
  bookingId?: string; // Optional booking reference
  messageType?: string; // 'general', 'payment_confirmation', 'booking_related'
}

interface MailerConfig {
  useSendgrid: boolean;
  sendgridApiKey?: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

async function getMailerConfig(): Promise<MailerConfig> {
  // Fetch email settings from database
  const settings = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.category, 'email'));

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string | null>);

  return {
    useSendgrid: settingsMap['use_sendgrid'] === 'true',
    sendgridApiKey: settingsMap['sendgrid_api_key'] || undefined,
    fromName: settingsMap['from_name'] || 'Din Trafikskola Hässleholm',
    fromEmail: settingsMap['from_email'] || 'noreply@dintrafikskolahlm.se',
    replyTo: settingsMap['reply_to'] || 'info@dintrafikskolahlm.se',
  };
}

async function saveInternalMessage(
  toEmail: string,
  subject: string,
  message: string,
  bookingId?: string,
  messageType: string = 'general'
) {
  try {
    // Find the recipient user by email
    const recipient = await db
      .select()
      .from(users)
      .where(eq(users.email, toEmail))
      .limit(1);

    if (!recipient[0]) {
      console.error(`User not found for email: ${toEmail}`);
      return;
    }

    // Get system user (first admin user)
    const systemUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (!systemUser[0]) {
      console.error('No admin user found for system messages');
      return;
    }

    // Save internal message
    await db.insert(internalMessages).values({
      fromUserId: systemUser[0].id,
      toUserId: recipient[0].id,
      subject,
      message,
      bookingId,
      messageType,
    });

    console.log(`Internal message saved for ${toEmail}`);
  } catch (error) {
    console.error('Error saving internal message:', error);
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = await getMailerConfig();

    // If SendGrid is enabled and configured
    if (config.useSendgrid && config.sendgridApiKey) {
      try {
        sgMail.setApiKey(config.sendgridApiKey);

        const msg = {
          to: options.to,
          from: {
            email: config.fromEmail,
            name: options.fromName || config.fromName,
          },
          replyTo: options.replyTo || config.replyTo,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text,
        };

        await sgMail.send(msg);
        console.log(`Email sent via SendGrid to ${options.to}`);
        return true;
      } catch (sendgridError) {
        console.error('SendGrid error:', sendgridError);
        // Fall back to internal messaging
        await saveInternalMessage(
          options.to,
          options.subject,
          options.html || options.text || '',
          options.bookingId,
          options.messageType
        );
        return false;
      }
    }

    // Fall back to internal messaging if SendGrid is not enabled
    await saveInternalMessage(
      options.to,
      options.subject,
      options.html || options.text || '',
      options.bookingId,
      options.messageType
    );
    return true;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return false;
  }
}

// Helper function to send booking confirmation email
export async function sendBookingConfirmation(
  toEmail: string,
  bookingDetails: {
    lessonType: string;
    date: string;
    time: string;
    price: number;
    swishUUID?: string;
    paymentLink?: string;
  }
) {
  const subject = 'Bokningsbekräftelse - Din Trafikskola Hässleholm';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Bokningsbekräftelse</h1>
      <p>Tack för din bokning!</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Bokningsdetaljer</h2>
        <p><strong>Lektionstyp:</strong> ${bookingDetails.lessonType}</p>
        <p><strong>Datum:</strong> ${bookingDetails.date}</p>
        <p><strong>Tid:</strong> ${bookingDetails.time}</p>
        <p><strong>Pris:</strong> ${bookingDetails.price} kr</p>
      </div>
      
      ${bookingDetails.swishUUID ? `
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Betalning med Swish</h3>
          <p>Swish-nummer: <strong>123 456 7890</strong></p>
          <p>Belopp: <strong>${bookingDetails.price} kr</strong></p>
          <p>Meddelande: <strong>${bookingDetails.swishUUID}</strong></p>
          <p style="color: #dc2626;"><strong>OBS!</strong> Ange meddelandet exakt som ovan för att din betalning ska registreras korrekt.</p>
        </div>
      ` : ''}
      
      ${bookingDetails.paymentLink ? `
        <a href="${bookingDetails.paymentLink}" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Bekräfta betalning
        </a>
      ` : ''}
      
      <p>Med vänliga hälsningar,<br>Din Trafikskola Hässleholm</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    messageType: 'booking_related',
  });
}

// Helper function to send cancellation notification
export async function sendCancellationNotification(
  toEmail: string,
  details: {
    lessonType: string;
    date: string;
    time: string;
    reason: string;
    creditAdded?: boolean;
  }
) {
  const subject = 'Avbokning - Din Trafikskola Hässleholm';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Avbokning</h1>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Avbokad lektion</h2>
        <p><strong>Lektionstyp:</strong> ${details.lessonType}</p>
        <p><strong>Datum:</strong> ${details.date}</p>
        <p><strong>Tid:</strong> ${details.time}</p>
        <p><strong>Anledning:</strong> ${details.reason}</p>
      </div>
      
      ${details.creditAdded ? `
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>En kredit har lagts till på ditt konto som du kan använda för framtida bokningar.</p>
        </div>
      ` : ''}
      
      <p>Om du har några frågor, kontakta oss gärna.</p>
      
      <p>Med vänliga hälsningar,<br>Din Trafikskola Hässleholm</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    messageType: 'booking_related',
  });
}

// Helper function to send reschedule notification
export async function sendRescheduleNotification(
  toEmail: string,
  details: {
    lessonType: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    reason: string;
  }
) {
  const subject = 'Ombokning - Din Trafikskola Hässleholm';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Ombokning</h1>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Din lektion har flyttats</h2>
        <p><strong>Lektionstyp:</strong> ${details.lessonType}</p>
        
        <div style="margin: 10px 0;">
          <p style="text-decoration: line-through; color: #6b7280;">
            <strong>Tidigare:</strong> ${details.oldDate} ${details.oldTime}
          </p>
          <p style="color: #059669;">
            <strong>Ny tid:</strong> ${details.newDate} ${details.newTime}
          </p>
        </div>
        
        <p><strong>Anledning:</strong> ${details.reason}</p>
      </div>
      
      <p>Om den nya tiden inte passar dig, vänligen kontakta oss så snart som möjligt.</p>
      
      <p>Med vänliga hälsningar,<br>Din Trafikskola Hässleholm</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    messageType: 'booking_related',
  });
}
