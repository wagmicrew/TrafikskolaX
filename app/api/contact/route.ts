import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, preferredContact } = body;

    // Validate required fields
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    if (preferredContact === 'email' && !email) {
      return NextResponse.json(
        { error: 'Email is required when email is preferred contact method' },
        { status: 400 }
      );
    }

    if (preferredContact === 'phone' && !phone) {
      return NextResponse.json(
        { error: 'Phone is required when phone is preferred contact method' },
        { status: 400 }
      );
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

    // Debug logging
    console.log('Contact form submission:', {
      name,
      email,
      phone,
      preferredContact,
      schoolEmail,
      schoolName
    });

    // Prepare email content
    const subject = `Nytt kontaktformulär från ${name}`;
    const contactInfo = preferredContact === 'email' 
      ? `E-post: ${email}`
      : `Telefon: ${phone}`;

    const emailContent = `
      <h2>Nytt kontaktformulär</h2>
      <p><strong>Namn:</strong> ${name}</p>
      <p><strong>Kontakt:</strong> ${contactInfo}</p>
      <p><strong>Meddelande:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    console.log('Attempting to send email to:', schoolEmail);

    // Send email to school using EnhancedEmailService
    const emailSent = await EnhancedEmailService.sendEmail({
      to: schoolEmail,
      subject,
      html: emailContent,
      fromName: schoolName,
      replyTo: email || undefined,
    });

    console.log('Email send result:', emailSent);

    return NextResponse.json({ 
      success: true, 
      message: 'Contact form submitted successfully',
      emailSent
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
} 