import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email is required' }, { status: 400 });
    }

    // Get school email from settings
    const schoolEmailSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'school_email'))
      .limit(1);

    const schoolEmail = schoolEmailSetting.length > 0 && schoolEmailSetting[0].value
      ? schoolEmailSetting[0].value 
      : 'info@dintrafikskolahlm.se';

    // Get school name from settings
    const schoolNameSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'schoolname'))
      .limit(1);

    const schoolName = schoolNameSetting.length > 0 && schoolNameSetting[0].value
      ? schoolNameSetting[0].value 
      : 'Din Trafikskola Hässleholm';

    console.log('Testing contact email configuration:', {
      schoolEmail,
      schoolName,
      testEmail
    });

    // Prepare test email content
    const subject = `Test kontaktformulär från ${schoolName}`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${schoolName}</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Test av kontaktformulär</h2>
          <p>Detta är ett test-meddelande för att verifiera att kontaktformuläret fungerar korrekt.</p>
          <p><strong>Test e-post:</strong> ${testEmail}</p>
          <p><strong>Tidpunkt:</strong> ${new Date().toLocaleString('sv-SE')}</p>
          
          <div style="text-align: center; margin: 30px 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 5px 0;">
              <strong>${schoolName}</strong>
            </p>
            <p style="color: #6b7280; margin: 5px 0;">
              E-post: info@dintrafikskolahlm.se | Telefon: 08-XXX XX XX
            </p>
          </div>
        </div>
      </div>
    `;

    // Send test email
    const emailSent = await sendEmail({
      to: schoolEmail,
      subject,
      html: emailContent,
      fromName: schoolName,
      replyTo: testEmail,
    });

    console.log('Test email send result:', emailSent);

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      emailSent,
      schoolEmail,
      schoolName
    });
  } catch (error) {
    console.error('Error sending test contact email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
} 