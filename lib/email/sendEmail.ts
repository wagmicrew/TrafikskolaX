import sgMail from '@sendgrid/mail';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to get SendGrid API key from database
async function getSendGridApiKey(): Promise<string> {
  try {
    const setting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'sendgrid_api_key'))
      .limit(1);
    
    if (setting.length > 0 && setting[0].value) {
      return setting[0].value;
    }
    
    // Fallback to environment variable if not in database
    return process.env.SENDGRID_API_KEY || '';
  } catch (error) {
    console.error('Error fetching SendGrid API key from database:', error);
    // Fallback to environment variable on error
    return process.env.SENDGRID_API_KEY || '';
  }
}

// Template for standard email format with branding
type EmailContent = {
  title: string;
  body: string;
};

export async function sendEmail(to: string, subject: string, content: EmailContent) {
  const apiKey = await getSendGridApiKey();
  if (!apiKey) {
    console.error('SendGrid API key not found, cannot send email');
    return;
  }
  sgMail.setApiKey(apiKey);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <!-- Email Container -->
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header with Brand Colors -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 20px; text-align: center;">
          <div style="background-color: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; display: inline-block;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              🚗 Din Trafikskola HLM
            </h1>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;">
            ${content.title}
          </h2>
          
          <div style="color: #374151; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
            ${content.body}
          </div>
          
          <!-- Call to Action Section -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">
              📚 Gå till Min Sida
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <div style="margin-bottom: 15px;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">Din Trafikskola HLM</h3>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Professionell körundervisning i Stockholm</p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              📧 <a href="mailto:info@dintrafikskolahlm.se" style="color: #dc2626; text-decoration: none;">info@dintrafikskolahlm.se</a> | 
              📞 <a href="tel:+46123456789" style="color: #dc2626; text-decoration: none;">+46 123 456 789</a>
            </p>
            <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} Din Trafikskola HLM. Alla rättigheter förbehållna.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Responsive Styles -->
      <style>
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            margin: 10px !important;
          }
          .email-content {
            padding: 20px !important;
          }
        }
      </style>
    </body>
    </html>
  `;

  await sgMail.send({
    from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
    to,
    subject,
    html: htmlContent,
  });
}
