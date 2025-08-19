import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type EmailTemplateVariables = {
  // User variables
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
  };
  
  // Booking variables
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
  
  // Teacher variables
  teacher?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  
  // System variables
  system: {
    appUrl: string;
    schoolName: string;
    schoolEmail: string;
    adminEmail: string;
    currentYear: string;
    currentDate: string;
  };
  
  // Custom variables (extension point)
  [key: string]: unknown;
};

/**
 * Get all available template variables with descriptions
 */
export function getTemplateVariableDocs(): Record<string, string> {
  return {
    // User variables
    '{{user.firstName}}': 'User\'s first name',
    '{{user.lastName}}': 'User\'s last name',
    '{{user.fullName}}': 'User\'s full name (first + last)',
    '{{user.email}}': 'User\'s email address',
    '{{user.role}}': 'User\'s role (student/teacher/admin)',
    
    // Booking variables
    '{{booking.id}}': 'Booking ID',
    '{{booking.scheduledDate}}': 'Scheduled date of the booking',
    '{{booking.startTime}}': 'Start time of the booking',
    '{{booking.endTime}}': 'End time of the booking',
    '{{booking.lessonTypeName}}': 'Name of the lesson type',
    '{{booking.totalPrice}}': 'Total price of the booking',
    '{{booking.paymentMethod}}': 'Payment method used',
    '{{booking.swishUUID}}': 'Swish payment reference (if applicable)',
    
    // Teacher variables
    '{{teacher.firstName}}': 'Teacher\'s first name',
    '{{teacher.lastName}}': 'Teacher\'s last name',
    '{{teacher.fullName}}': 'Teacher\'s full name (first + last)',
    '{{teacher.email}}': 'Teacher\'s email address',
    
    // System variables
    '{{appUrl}}': 'Base URL of the application',
    '{{schoolName}}': 'Name of the driving school',
    '{{schoolEmail}}': 'School\'s contact email',
    '{{adminEmail}}': 'Administrator\'s email',
    '{{currentYear}}': 'Current year',
    '{{currentDate}}': 'Current date',
  };
}

/**
 * Get the default template for a specific trigger type
 */
export async function getDefaultTemplate(triggerType: string): Promise<{
  subject: string;
  htmlContent: string;
  receivers: string[];
}> {
  const templates: Record<string, {
    subject: string;
    htmlContent: string;
    receivers: string[];
  }> = {
    new_user: {
      subject: 'Välkommen till {{schoolName}}!',
      htmlContent: `
        <h1>Välkommen {{user.firstName}}!</h1>
        <p>Ditt konto hos {{schoolName}} är nu skapat. Du kan logga in och komma igång direkt.</p>
        {{#if customData.password}}
        <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #dc2626;">
          <p style="margin:8px 0;"><strong>Dina inloggningsuppgifter</strong></p>
          <p style="margin:8px 0;"><strong>E‑post:</strong> {{user.email}}</p>
          <p style="margin:8px 0;"><strong>Lösenord:</strong> {{customData.password}}</p>
          {{#if customData.customerNumber}}
          <p style="margin:8px 0;"><strong>Kundnummer:</strong> {{customData.customerNumber}}</p>
          {{/if}}
        </div>
        <p style="margin:8px 0 0 0;"><strong>Viktigt:</strong> Byt lösenord efter första inloggningen.</p>
        {{/if}}
        <div style="margin-top:16px;">
          <a href="{{appUrl}}/login" data-btn>Öppna kundportalen</a>
        </div>
        <p style="margin-top:16px;">Behöver du hjälp? Kontakta oss så hjälper vi dig.</p>
      `,
      receivers: ['student']
    },
    new_booking: {
      subject: 'Bokningsbekräftelse - {{booking.lessonTypeName}}',
      htmlContent: `
        <h1>Tack för din bokning!</h1>
        <p>Hej {{user.firstName}}, din bokning är registrerad.</p>
        <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
          <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
          <p style="margin:8px 0;"><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
          <p style="margin:8px 0;"><strong>Pris:</strong> {{booking.totalPrice}} kr</p>
        </div>
        <div style="margin-top:12px;">
          <a href="{{appUrl}}/dashboard" data-btn>Visa bokning</a>
        </div>
        <p style="margin-top:16px;">Om du behöver omboka eller har frågor, hör av dig.</p>
      `,
      receivers: ['student', 'admin']
    },
    payment_confirmed: {
      subject: 'Betalning mottagen - {{booking.lessonTypeName}}',
      htmlContent: `
        <h1>Tack för din betalning!</h1>
        <p>Hej {{user.firstName}}, vi har tagit emot din betalning.</p>
        <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:8px 0;"><strong>Boknings‑ID:</strong> {{booking.id}}</p>
          <p style="margin:8px 0;"><strong>Typ:</strong> {{booking.lessonTypeName}}</p>
          <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
          <p style="margin:8px 0;"><strong>Belopp:</strong> {{booking.totalPrice}} kr</p>
        </div>
        <div style="margin-top:12px;">
          <a href="{{appUrl}}/dashboard" data-btn>Öppna Mina sidor</a>
        </div>
        <p style="margin-top:16px;">Din bokning är nu bekräftad. Välkommen!</p>
      `,
      receivers: ['student']
    },
    // Add more default templates as needed
  };

  return templates[triggerType] || {
    subject: 'Meddelande från {{schoolName}}',
    htmlContent: `
      <h1>Hej {{user.firstName}}!</h1>
      <p>Detta är ett automatiskt meddelande från {{schoolName}}.</p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
  };
}

/**
 * Validate template HTML content for common issues
 */
export function validateTemplateHtml(html: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for required elements
  if (!html.includes('{{schoolName}}')) {
    issues.push('Template should include {{schoolName}} variable');
  }
  
  if (!html.includes('{{appUrl}}')) {
    issues.push('Template should include {{appUrl}} for links back to the application');
  }
  
  // Check for common HTML issues
  if (html.includes('<style>') && !html.includes('</style>')) {
    issues.push('Unclosed <style> tag detected');
  }
  
  if ((html.match(/<a\b[^>]*>/g) || []).length !== (html.match(/<\/a>/g) || []).length) {
    issues.push('Mismatched <a> tags detected');
  }
  
  // Add more validation rules as needed
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Format template HTML with proper indentation for better readability
 */
export function formatTemplateHtml(html: string): string {
  // Remove all existing whitespace between tags
  const formatted = html
    .replace(/\s*<\/?(\w+)[^>]*?>\s*/g, (match) => match.trim())
    .replace(/\s+/g, ' ')
    .trim();
  
  // Add proper indentation
  let indent = '';
  const lines: string[] = [];
  const tokens = formatted.match(/<[^>]+>|[^<]+/g) || [];
  
  for (const token of tokens) {
    if (token.startsWith('</')) {
      indent = indent.slice(2);
      lines.push(`${indent}${token}`);
    } else if (token.startsWith('<') && !token.endsWith('/>')) {
      lines.push(`${indent}${token}`);
      if (!token.endsWith('</') && !token.endsWith('/>')) {
        indent += '  ';
      }
    } else {
      lines.push(`${indent}${token}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Update an email template in the database
 */
export async function updateEmailTemplate(
  templateId: string, 
  updates: { subject?: string; htmlContent?: string; isActive?: boolean }
): Promise<boolean> {
  try {
    await db
      .update(emailTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(emailTemplates.id, templateId));
    
    return true;
  } catch (error) {
    console.error('Error updating email template:', error);
    return false;
  }
}
