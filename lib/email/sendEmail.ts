import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to fetch email configuration from database
async function getEmailConfig(): Promise<{
  // SendGrid settings
  apiKey: string;
  useSendGrid: boolean;
  // SMTP settings
  useSmtp: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  // Common settings
  fromName: string;
  fromEmail: string;
  replyTo: string;
}> {
  try {
    // Fetch all required settings
    const settingsKeys = [
      'sendgrid_api_key', 'use_sendgrid',
      'use_smtp', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_secure',
      'from_name', 'from_email', 'reply_to'
    ];

    const settingsPromises = settingsKeys.map(key => 
      db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1)
    );

    const settingsResults = await Promise.all(settingsPromises);
    
    // Helper function to get setting value
    const getSetting = (index: number, defaultValue: any = '') => {
      const result = settingsResults[index];
      return result.length > 0 ? result[0].value : defaultValue;
    };

    const config = {
      // SendGrid settings
      apiKey: getSetting(0) || process.env.SENDGRID_API_KEY || '',
      useSendGrid: getSetting(1) === 'true',
      // SMTP settings
      useSmtp: getSetting(2) === 'true',
      smtpHost: getSetting(3, 'mailcluster.loopia.se'),
      smtpPort: parseInt(getSetting(4, '587')),
      smtpUsername: getSetting(5, 'admin@dintrafikskolahlm.se'),
      smtpPassword: getSetting(6, 'Tropictiger2025!'),
      smtpSecure: getSetting(7, 'false') === 'true',
      // Common settings
      fromName: getSetting(8, 'Din Trafikskola HLM'),
      fromEmail: getSetting(9, 'admin@dintrafikskolahlm.se'),
      replyTo: getSetting(10, 'info@dintrafikskolahlm.se')
    };
    
    console.log('Email configuration:', {
      useSendGrid: config.useSendGrid,
      useSmtp: config.useSmtp,
      hasApiKey: !!config.apiKey,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUsername: config.smtpUsername,
      hasSmtpPassword: !!config.smtpPassword,
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      replyTo: config.replyTo
    });
    
    return config;
  } catch (error) {
    console.error('Error fetching email configuration from database:', error);
    // Return defaults with SMTP as fallback
    return {
      apiKey: process.env.SENDGRID_API_KEY || '',
      useSendGrid: false,
      useSmtp: true,
      smtpHost: 'mailcluster.loopia.se',
      smtpPort: 587,
      smtpUsername: 'admin@dintrafikskolahlm.se',
      smtpPassword: 'Tropictiger2025!',
      smtpSecure: false,
      fromName: 'Din Trafikskola HLM',
      fromEmail: 'admin@dintrafikskolahlm.se',
      replyTo: 'info@dintrafikskolahlm.se'
    };
  }
}

// Template for standard email format with branding
type EmailContent = {
  title: string;
  body: string;
};

export async function sendEmail(to: string, subject: string, content: EmailContent) {
  try {
    const config = await getEmailConfig();
    
    console.log('Attempting to send email:', {
      to,
      subject,
      useSendGrid: config.useSendGrid,
      useSmtp: config.useSmtp,
      hasApiKey: !!config.apiKey
    });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <!-- Email Structure -->
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 20px; text-align: center;">
            <div style="background-color: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; display: inline-block;">
              <!-- Logo -->
              <img src="https://dintrafikskolahlm.se/images/logo-mini.png" alt="Din Trafikskola" style="width: 60px; height: 60px; margin-bottom: 10px; border-radius: 8px;" />
              <div style="color: #ffffff; margin: 0; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 2px;">Din Trafikskola</div>
                <div style="font-size: 16px; font-weight: normal;">Hässleholm</div>
              </div>
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
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">
                📚 Gå till Min Sida
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                📧 <a href="mailto:info@dintrafikskolahlm.se" style="color: #dc2626; text-decoration: none;">info@dintrafikskolahlm.se</a> | 
                📞 <a href="tel:+46123456789" style="color: #dc2626; text-decoration: none;">+46 123 456 789</a>
              </p>
              <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} Din Trafikskola Hässleholm. Alla rättigheter förbehållna.
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

    const emailData = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html: htmlContent,
      replyTo: config.replyTo,
    };

    // Determine which email service to use
    if (config.useSendGrid && config.apiKey) {
      console.log('Sending email via SendGrid...');
      sgMail.setApiKey(config.apiKey);
      
      await sgMail.send(emailData);
      console.log('Email sent successfully using SendGrid to:', to);
      
    } else if (config.useSmtp && config.smtpHost && config.smtpUsername && config.smtpPassword) {
      console.log('Sending email via SMTP...');
      
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false, // true for 465, false for other ports (587 uses STARTTLS)
        requireTLS: true, // Force STARTTLS for port 587
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword
        },
        tls: {
          rejectUnauthorized: false, // Accept self-signed certificates
          ciphers: 'SSLv3' // Support older SSL versions if needed
        }
      });

      // Verify connection
      await transporter.verify();
      console.log('SMTP connection verified successfully');

      await transporter.sendMail(emailData);
      console.log('Email sent successfully using SMTP to:', to);
      
    } else {
      const errorMessage = 'No email service configured or missing credentials. Please configure SendGrid or SMTP in Admin Settings.';
      console.error(errorMessage);
      console.error('Config check:', {
        useSendGrid: config.useSendGrid,
        hasApiKey: !!config.apiKey,
        useSmtp: config.useSmtp,
        hasSmtpHost: !!config.smtpHost,
        hasSmtpCredentials: !!(config.smtpUsername && config.smtpPassword)
      });
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('Error in sending email:', error);
    throw error; // Re-throw to let caller handle it properly
  }
}
