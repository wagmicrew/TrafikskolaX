export async function sendEmail(options: EmailOptions): Promise<boolean> {
  return EnhancedEmailService.sendEmail(options);
}

import { db } from '@/lib/db';
import { siteSettings, internalMessages, users, emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';

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
  emailMethod: 'smtp' | 'sendgrid' | 'internal';
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  sendgridApiKey?: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
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


// Base email template function
function createEmailTemplate(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Din Trafikskola Hässleholm</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb;">
        ${content}
        
        <div style="text-align: center; margin: 30px 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 5px 0;">
            <strong>Din Trafikskola Hässleholm</strong>
          </p>
          <p style="color: #6b7280; margin: 5px 0;">
            Östergatan 3a, 281 30 Hässleholm
          </p>
          <p style="color: #6b7280; margin: 5px 0;">
            Telefon: 0760-38 91 92
          </p>
          <p style="color: #6b7280; margin: 5px 0;">
            E-post: info@dintrafikskolahlm.se
          </p>
        </div>
      </div>
    </div>
  `;
}

// Helper function to send booking confirmation email
// Function to test send templates with mock data
export async function testSendTemplate(toEmail: string, templateId: string) {
  const mockData = {
    lessonType: 'Körlektion',
    date: '2025-08-15',
    time: '14:30',
    price: 495,
    userName: 'Användarnamn',
    userNumber: 'DTS0003',
    loginUrl: 'http://example.com/login',
  };

  const emailTemplate = await db.select().from(emailTemplates).where(eq(emailTemplates.id, templateId)).limit(1);

  if (!emailTemplate.length) {
    console.error('Template not found');
    return false;
  }

  const html = emailTemplate[0].htmlContent
    .replace('{{userName}}', mockData.userName)
    .replace('{{userNumber}}', mockData.userNumber)
    .replace('{{loginUrl}}', mockData.loginUrl);

  const subject = emailTemplate[0].subject;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    messageType: 'test',
  });
}

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
  
  const content = `
    <h2 style="color: #dc2626;">Bokningsbekräftelse</h2>
    <p>Tack för din bokning!</p>
    
    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #dc2626; margin-top: 0;">Bokningsdetaljer</h3>
      <p><strong>Lektionstyp:</strong> ${bookingDetails.lessonType}</p>
      <p><strong>Datum:</strong> ${bookingDetails.date}</p>
      <p><strong>Tid:</strong> ${bookingDetails.time}</p>
      <p><strong>Pris:</strong> ${bookingDetails.price} kr</p>
    </div>
    
    ${bookingDetails.swishUUID ? `
      <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin-top: 0;">Betalning med Swish</h4>
        <p>Swish-nummer: <strong>123 456 7890</strong></p>
        <p>Belopp: <strong>${bookingDetails.price} kr</strong></p>
        <p>Meddelande: <strong>${bookingDetails.swishUUID}</strong></p>
        <p style="color: #dc2626;"><strong>OBS!</strong> Ange meddelandet exakt som ovan för att din betalning ska registreras korrekt.</p>
      </div>
    ` : ''}
    
    ${bookingDetails.paymentLink ? `
      <p style="text-align: center; margin: 20px 0;">
        <a href="${bookingDetails.paymentLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          Bekräfta betalning
        </a>
      </p>
    ` : ''}
    
    <p>Vi ser fram emot att träffa dig!</p>
  `;

  const html = createEmailTemplate(content);

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
  
  const content = `
    <h2 style="color: #dc2626;">Avbokning</h2>
    
    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #dc2626; margin-top: 0;">Avbokad lektion</h3>
      <p><strong>Lektionstyp:</strong> ${details.lessonType}</p>
      <p><strong>Datum:</strong> ${details.date}</p>
      <p><strong>Tid:</strong> ${details.time}</p>
      <p><strong>Anledning:</strong> ${details.reason}</p>
    </div>
    
    ${details.creditAdded ? `
      <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin-top: 0;">Kredit tillagd</h4>
        <p>En kredit har lagts till på ditt konto som du kan använda för framtida bokningar.</p>
      </div>
    ` : ''}
    
    <p>Om du har några frågor, kontakta oss gärna.</p>
  `;

  const html = createEmailTemplate(content);

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
  
  const content = `
    <h2 style="color: #dc2626;">Ombokning</h2>
    
    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #dc2626; margin-top: 0;">Din lektion har flyttats</h3>
      <p><strong>Lektionstyp:</strong> ${details.lessonType}</p>
      
      <p style="text-decoration: line-through; color: #6b7280;">
        <strong>Tidigare:</strong> ${details.oldDate} ${details.oldTime}
      </p>
      <p style="color: #059669;">
        <strong>Ny tid:</strong> ${details.newDate} ${details.newTime}
      </p>
      
      <p><strong>Anledning:</strong> ${details.reason}</p>
    </div>
    
    <p>Om den nya tiden inte passar dig, vänligen kontakta oss så snart som möjligt.</p>
  `;

  const html = createEmailTemplate(content);

  return sendEmail({
    to: toEmail,
    subject,
    html,
    messageType: 'booking_related',
  });
}
