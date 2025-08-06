import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const user = authResult.user;

    const { testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test-e-post krävs' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Ogiltig e-postadress' },
        { status: 400 }
      );
    }

    // Get school settings from database
    const schoolnameSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'schoolname'))
      .limit(1);

    const schoolPhoneSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'school_phonenumber'))
      .limit(1);

    const schoolEmailSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'school_email'))
      .limit(1);

    const schoolname = schoolnameSetting.length > 0 ? schoolnameSetting[0].value : 'Din Trafikskola Hässleholm';
    const schoolPhone = schoolPhoneSetting.length > 0 ? schoolPhoneSetting[0].value : '08-XXX XX XX';
    const schoolEmail = schoolEmailSetting.length > 0 ? schoolEmailSetting[0].value : 'info@dintrafikskolahlm.se';

    // Create test contact form data
    const testContactData = {
      name: 'Test Testsson',
      email: 'test@example.com',
      phone: '070-123 45 67',
      message: 'Detta är ett testmeddelande från kontaktformuläret för att verifiera att e-postdesignen fungerar korrekt med den fullständiga mallen.',
      preferredContact: 'email'
    };

    // Prepare email content (same as contact form)
    const subject = `[TEST] Nytt kontaktformulär från ${testContactData.name}`;
    const contactInfo = testContactData.preferredContact === 'email' 
      ? `E-post: ${testContactData.email}`
      : `Telefon: ${testContactData.phone}`;

    const emailContent = `
      <div style="background-color: #fbbf24; color: #92400e; padding: 12px; text-align: center; font-weight: bold; margin-bottom: 20px; border-radius: 4px;">
        🧪 DETTA ÄR ETT TEST-E-POST - Kontaktformulär Design
      </div>
      
      <h2>Nytt kontaktformulär</h2>
      <p><strong>Namn:</strong> ${testContactData.name}</p>
      <p><strong>Kontakt:</strong> ${contactInfo}</p>
      <p><strong>Meddelande:</strong></p>
      <p>${testContactData.message.replace(/\n/g, '<br>')}</p>
    `;

    // Send email using EnhancedEmailService for full branded template
    const emailSent = await EnhancedEmailService.sendEmail({
      to: testEmail,
      subject,
      html: emailContent,
      fromName: schoolname,
      replyTo: testContactData.email,
    });

    // Log the test email attempt
    logger.info('email', 'Contact form design test email sent', {
      testEmail,
      success: emailSent,
      adminUser: user.email
    }, user.id);

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test-e-post med kontaktformulär design skickades framgångsrikt!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'E-posten kunde inte skickas, men ett internt meddelande har sparats.'
      });
    }

  } catch (error) {
    logger.error('email', 'Contact form design test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    console.error('Contact form design test error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid skickande av test-e-post' },
      { status: 500 }
    );
  }
} 