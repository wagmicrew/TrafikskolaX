import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { emailTemplates, emailReceivers, siteSettings } from '@/lib/db/schema';
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

    const { templateId, testEmail } = await request.json();

    if (!templateId || !testEmail) {
      return NextResponse.json(
        { error: 'Mall-ID och test-e-post krävs' },
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

    // Fetch the email template
    const template = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Mall hittades inte' },
        { status: 404 }
      );
    }

    const emailTemplate = template[0];

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

    // Create test data for template variables
    const testData = {
      user: {
        firstName: 'Test',
        lastName: 'Testsson',
        fullName: 'Test Testsson',
        email: testEmail,
        customerNumber: 'TEST001'
      },
      booking: {
        id: 'test-booking-123',
        scheduledDate: new Date().toLocaleDateString('sv-SE'),
        startTime: '14:00',
        endTime: '15:00',
        lessonTypeName: 'B-körkort 45 min',
        totalPrice: '695',
        swishUUID: 'TEST-SWISH-123'
      },
      customData: {
        swishNumber: '123 456 78 90'
      },
      schoolName: schoolname,
      schoolPhone: schoolPhone,
      schoolEmail: schoolEmail,
                             appUrl: request.nextUrl.origin || process.env.NEXTAUTH_URL || 'https://www.dintrafikskolahlm.se',
         baseUrl: request.nextUrl.origin || process.env.NEXTAUTH_URL || 'https://www.dintrafikskolahlm.se',
      currentYear: new Date().getFullYear().toString(),
      currentDate: new Date().toLocaleDateString('sv-SE'),
      temporaryPassword: 'TempPass123!'
    };

    // Replace template variables with test data
    let processedSubject = emailTemplate.subject;
    let processedContent = emailTemplate.htmlContent;

    // Replace variables in subject
    processedSubject = processedSubject
      .replace(/\{\{user\.firstName\}\}/g, testData.user.firstName)
      .replace(/\{\{user\.lastName\}\}/g, testData.user.lastName)
      .replace(/\{\{user\.fullName\}\}/g, testData.user.fullName)
      .replace(/\{\{user\.email\}\}/g, testData.user.email)
      .replace(/\{\{user\.customerNumber\}\}/g, testData.user.customerNumber)
      .replace(/\{\{booking\.lessonTypeName\}\}/g, testData.booking.lessonTypeName)
      .replace(/\{\{schoolName\}\}/g, testData.schoolName);

    // Replace variables in content
    processedContent = processedContent
      .replace(/\{\{user\.firstName\}\}/g, testData.user.firstName)
      .replace(/\{\{user\.lastName\}\}/g, testData.user.lastName)
      .replace(/\{\{user\.fullName\}\}/g, testData.user.fullName)
      .replace(/\{\{user\.email\}\}/g, testData.user.email)
      .replace(/\{\{user\.customerNumber\}\}/g, testData.user.customerNumber)
      .replace(/\{\{booking\.id\}\}/g, testData.booking.id)
      .replace(/\{\{booking\.scheduledDate\}\}/g, testData.booking.scheduledDate)
      .replace(/\{\{booking\.startTime\}\}/g, testData.booking.startTime)
      .replace(/\{\{booking\.endTime\}\}/g, testData.booking.endTime)
      .replace(/\{\{booking\.lessonTypeName\}\}/g, testData.booking.lessonTypeName)
      .replace(/\{\{booking\.totalPrice\}\}/g, testData.booking.totalPrice)
      .replace(/\{\{booking\.swishUUID\}\}/g, testData.booking.swishUUID)
      .replace(/\{\{customData\.swishNumber\}\}/g, testData.customData.swishNumber)
      .replace(/\{\{schoolName\}\}/g, testData.schoolName)
      .replace(/\{\{schoolPhone\}\}/g, testData.schoolPhone)
      .replace(/\{\{schoolEmail\}\}/g, testData.schoolEmail)
      .replace(/\{\{appUrl\}\}/g, testData.appUrl)
      .replace(/\{\{baseUrl\}\}/g, testData.baseUrl)
      .replace(/\{\{currentYear\}\}/g, testData.currentYear)
      .replace(/\{\{currentDate\}\}/g, testData.currentDate)
      .replace(/\{\{temporaryPassword\}\}/g, testData.temporaryPassword);

    // Add test banner to the email
    const testBanner = `
      <div style="background-color: #fbbf24; color: #92400e; padding: 12px; text-align: center; font-weight: bold; margin-bottom: 20px; border-radius: 4px;">
        🧪 DETTA ÄR ETT TEST-E-POST - Mall: ${emailTemplate.triggerType}
      </div>
    `;

    const finalContent = testBanner + processedContent;

    // Send the test email using EnhancedEmailService for full branded template
    const emailSent = await EnhancedEmailService.sendEmail({
      to: testEmail,
      subject: `[TEST] ${processedSubject}`,
      html: finalContent,
      messageType: 'test'
    });

    // Log the test email attempt
    logger.info('email', 'Test email sent', {
      templateId,
      templateType: emailTemplate.triggerType,
      testEmail,
      success: emailSent,
      adminUser: user.email
    }, user.id);

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test-e-post skickades framgångsrikt!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'E-posten kunde inte skickas, men ett internt meddelande har sparats.'
      });
    }

  } catch (error) {
    logger.error('email', 'Email test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    console.error('Email test error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid skickande av test-e-post' },
      { status: 500 }
    );
  }
}
