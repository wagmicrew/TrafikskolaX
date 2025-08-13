import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';

// Template for standard email format with branding
type EmailContent = {
  title: string;
  body: string;
};

export async function sendEmail(to: string, subject: string, content: EmailContent) {
  const innerHtml = `
    <h2 style="color: #dc2626; font-size: 22px; margin: 0 0 16px; text-align: left;">
      ${content.title}
    </h2>
    <div style="color: #374151; line-height: 1.6; font-size: 16px;">${content.body}</div>
  `;

  return EnhancedEmailService.sendEmail({
    to,
    subject,
    html: innerHtml,
  });
}
