import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/sendEmail';
import { createTestEmailTemplate } from '@/lib/email/templates/test-email-template';

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI('admin');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Get email settings from database
    const settingsRows = await db
      .select()
      .from(siteSettings)
      .where(
        eq(siteSettings.category, 'email')
      );

    const settings = settingsRows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    // Get school contact settings
    const contactSettingsRows = await db
      .select()
      .from(siteSettings)
      .where(
        eq(siteSettings.key, 'school_contact_email')
      );

    const schoolContactEmail = contactSettingsRows.length > 0 ? contactSettingsRows[0].value : settings.from_email;
    const schoolContactName = settings.school_contact_name || 'Trafikskolan';
    
    // Create test email content
    const { htmlContent, textContent } = createTestEmailTemplate({
      recipientName: email.split('@')[0] || 'Admin',
      schoolName: settings.from_name || 'Din Trafikskola',
      contactEmail: schoolContactEmail,
      contactName: schoolContactName
    });

    // Send test email
    await sendEmail(email, 'Test av skolans kontakt-email', {
      title: 'Test av skolans kontakt-email',
      body: htmlContent
    });

    return NextResponse.json({ 
      success: true,
      message: 'Test email sent successfully' 
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
